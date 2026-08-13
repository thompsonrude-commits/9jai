import { EventEmitter } from 'events';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type { PluginDescriptor, PluginHealth, PluginState, PluginContext, PluginDependency, PluginSecurityProvider } from './types';
import type { CapabilityRegistry } from '../capabilities/CapabilityRegistry';

export interface PluginLifecycleSummary {
  pluginId: string;
  state: PluginState;
  message: string;
}

export interface PluginManager {
  register(plugin: PluginDescriptor): void;
  unregister(pluginId: string): void;
  loadPlugin(modulePath: string): Promise<void>;
  unload(pluginId: string): Promise<void>;
  get(pluginId: string): PluginDescriptor | undefined;
  list(): PluginDescriptor[];
  initialize(pluginId: string, context: PluginContext): Promise<void>;
  start(pluginId: string): Promise<void>;
  stop(pluginId: string): Promise<void>;
  reload(pluginId: string, context: PluginContext): Promise<void>;
  health(pluginId: string): Promise<PluginHealth>;
  resolveDependencies(pluginId: string): string[];
  validatePlugin(pluginId: string): void;
}

export const pluginEvents = new EventEmitter();

function versionMatches(range: string | undefined, version: string): boolean {
  if (!range) return true;
  if (range === version) return true;
  if (range.startsWith('^')) {
    return version.split('.')[0] === range.slice(1).split('.')[0];
  }
  if (range.startsWith('~')) {
    const [major, minor] = range.slice(1).split('.');
    const [vMajor, vMinor] = version.split('.');
    return vMajor === major && vMinor === minor;
  }
  return false;
}

export class DefaultPluginManager implements PluginManager {
  private plugins = new Map<string, PluginDescriptor>();
  private states = new Map<string, PluginState>();
  private modulePaths = new Map<string, string>();
  private securityProvider?: PluginSecurityProvider;

  constructor(private readonly registry: CapabilityRegistry, securityProvider?: PluginSecurityProvider) {
    this.securityProvider = securityProvider;
  }

  register(plugin: PluginDescriptor): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`);
    }
    this.plugins.set(plugin.id, plugin);
    this.states.set(plugin.id, 'registered');

    for (const descriptor of plugin.capabilityDescriptors ?? []) {
      this.registry.register(descriptor);
      pluginEvents.emit('CapabilityRegistered', { pluginId: plugin.id, capabilityId: descriptor.capabilityId });
    }

    pluginEvents.emit('PluginRegistered', { pluginId: plugin.id });
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      for (const descriptor of plugin.capabilityDescriptors ?? []) {
        this.registry.unregister(descriptor.capabilityId);
        pluginEvents.emit('CapabilityRemoved', { pluginId, capabilityId: descriptor.capabilityId });
      }
    }
    this.plugins.delete(pluginId);
    this.states.delete(pluginId);
    pluginEvents.emit('PluginUnregistered', { pluginId });
  }

  get(pluginId: string): PluginDescriptor | undefined {
    return this.plugins.get(pluginId);
  }

  list(): PluginDescriptor[] {
    return Array.from(this.plugins.values());
  }

  async loadPlugin(modulePath: string): Promise<void> {
    const resolvedPath = path.resolve(modulePath);
    const moduleUrl = pathToFileURL(resolvedPath).href;
    const imported = await import(moduleUrl);
    const descriptor = imported.default ?? imported.plugin ?? imported;
    if (!descriptor || typeof descriptor !== 'object' || !descriptor.id) {
      throw new Error(`Invalid plugin module loaded from ${modulePath}`);
    }

    if (this.plugins.has(descriptor.id)) {
      throw new Error(`Plugin ${descriptor.id} already loaded`);
    }

    if (this.securityProvider) {
      if (typeof descriptor.signature === 'string' && this.securityProvider.verifySignature) {
        const trusted = await this.securityProvider.verifySignature(descriptor.id, descriptor.signature);
        if (!trusted) {
          throw new Error(`Plugin ${descriptor.id} failed signature verification`);
        }
      }

      for (const permission of descriptor.permissions ?? []) {
        const authorized = await this.securityProvider.authorize(descriptor.id, permission);
        if (!authorized) {
          throw new Error(`Plugin ${descriptor.id} is not authorized for permission ${permission}`);
        }
      }
    }

    this.register(descriptor);
    this.modulePaths.set(descriptor.id, resolvedPath);
  }

  async unload(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);

    const state = this.states.get(pluginId);
    if (state === 'running' || state === 'starting') {
      await this.stop(pluginId);
    }

    if (plugin.dispose) {
      try {
        await plugin.dispose();
      } catch (error) {
        this.states.set(pluginId, 'failed');
        pluginEvents.emit('PluginFailed', { pluginId, error });
        throw error;
      }
    }

    this.unregister(pluginId);
    this.modulePaths.delete(pluginId);
    pluginEvents.emit('PluginUnloaded', { pluginId });
  }

  async initialize(pluginId: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    this.validatePlugin(pluginId);
    this.states.set(pluginId, 'initializing');
    pluginEvents.emit('PluginInitializing', { pluginId });
    try {
      await plugin.initialize?.(context);
      this.states.set(pluginId, 'initialized');
      pluginEvents.emit('PluginInitialized', { pluginId });
    } catch (error) {
      this.states.set(pluginId, 'failed');
      pluginEvents.emit('PluginFailed', { pluginId, error });
      throw error;
    }
  }

  async start(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    const state = this.states.get(pluginId);
    if (state !== 'initialized' && state !== 'stopped' && state !== 'paused') {
      throw new Error(`Plugin ${pluginId} cannot start from state ${state}`);
    }
    this.states.set(pluginId, 'starting');
    pluginEvents.emit('PluginStarting', { pluginId });
    try {
      await plugin.start?.();
      this.states.set(pluginId, 'running');
      pluginEvents.emit('PluginStarted', { pluginId });
    } catch (error) {
      this.states.set(pluginId, 'failed');
      pluginEvents.emit('PluginFailed', { pluginId, error });
      throw error;
    }
  }

  async lifecycleSummary(pluginId: string): Promise<PluginLifecycleSummary> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    return { pluginId, state: this.states.get(pluginId) ?? 'registered', message: `Plugin ${pluginId} is ${this.states.get(pluginId) ?? 'registered'}` };
  }

  async stop(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    this.states.set(pluginId, 'stopping');
    pluginEvents.emit('PluginStopping', { pluginId });
    try {
      await plugin.stop?.();
      this.states.set(pluginId, 'stopped');
      pluginEvents.emit('PluginStopped', { pluginId });
    } catch (error) {
      this.states.set(pluginId, 'failed');
      pluginEvents.emit('PluginFailed', { pluginId, error });
      throw error;
    }
  }

  async reload(pluginId: string, context: PluginContext): Promise<void> {
    await this.stop(pluginId);
    await this.initialize(pluginId, context);
    await this.start(pluginId);
    pluginEvents.emit('PluginReloaded', { pluginId });
  }

  async health(pluginId: string): Promise<PluginHealth> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    const state = this.states.get(pluginId) ?? 'unknown';
    const health = await plugin.healthCheck?.();
    return {
      pluginId,
      state,
      status: health?.status ?? 'unknown',
      startupTime: health?.startupTime ?? null,
      memoryUsageMb: health?.memoryUsageMb ?? null,
      cpuUsagePercent: health?.cpuUsagePercent ?? null,
      errorCount: health?.errorCount ?? 0,
      lastSuccess: health?.lastSuccess ?? null,
      lastFailure: health?.lastFailure ?? null,
      version: plugin.version,
    };
  }

  resolveDependencies(pluginId: string): string[] {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    const resolved: string[] = [];
    const stack: string[] = [];

    const visit = (id: string) => {
      if (stack.includes(id)) {
        throw new Error(`Circular dependency detected: ${[...stack, id].join(' -> ')}`);
      }
      if (resolved.includes(id)) return;
      const p = this.plugins.get(id);
      if (!p) throw new Error(`Dependency ${id} not registered for plugin ${pluginId}`);
      stack.push(id);
      for (const dep of p.dependencies ?? []) {
        if (!versionMatches(dep.versionRange, this.plugins.get(dep.pluginId)?.version)) {
          throw new Error(`Incompatible dependency ${dep.pluginId} for plugin ${pluginId}`);
        }
        visit(dep.pluginId);
      }
      stack.pop();
      resolved.push(id);
    };

    for (const dep of plugin.dependencies ?? []) {
      if (!dep.optional || (dep.optional && this.plugins.has(dep.pluginId))) {
        visit(dep.pluginId);
      }
    }

    return resolved;
  }

  validatePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);
    for (const dep of plugin.dependencies ?? []) {
      if (!dep.optional && !this.plugins.has(dep.pluginId)) {
        throw new Error(`Required dependency ${dep.pluginId} for plugin ${pluginId} is missing`);
      }
      if (this.plugins.has(dep.pluginId) && !versionMatches(dep.versionRange, this.plugins.get(dep.pluginId)!.version)) {
        throw new Error(`Dependency ${dep.pluginId} version mismatch for plugin ${pluginId}`);
      }
    }
  }
}
