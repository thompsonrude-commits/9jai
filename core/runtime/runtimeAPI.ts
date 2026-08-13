import { ModelRegistry } from './modelRegistry';
import { ModelLoader } from './modelLoader';
import { LifecycleManager } from './lifecycleManager';
import { ConfigManager } from './configManager';
import { ResourceManager } from './resourceManager';
import { HealthMonitor } from './healthMonitor';
import { CapabilityManager } from './capabilityManager';
import { VersionManager } from './versionManager';
import type { ModelMetadata, ModelRecord, RuntimeHealth } from './types';
import { runtimeEvents } from './events';

export class ModelRuntimeAPI {
  registry: ModelRegistry;
  loader: ModelLoader;
  lifecycle: LifecycleManager;
  config: ConfigManager;
  resources: ResourceManager;
  health: HealthMonitor;
  capabilities: CapabilityManager;
  versions: VersionManager;

  constructor(configFile?: string) {
    this.registry = new ModelRegistry();
    this.loader = new ModelLoader();
    this.lifecycle = new LifecycleManager(this.registry, this.loader);
    this.config = new ConfigManager(configFile);
    this.resources = new ResourceManager();
    this.health = new HealthMonitor(this.resources, this.registry);
    this.capabilities = new CapabilityManager();
    this.versions = new VersionManager(this.registry);
  }

  async registerModel(meta: ModelMetadata) {
    const record: ModelRecord = { ...meta, status: 'registered', lastUpdated: new Date().toISOString() };
    this.registry.register(record);
    this.capabilities.registerModelCapabilities(meta.id, meta.capabilities);
  }

  async loadModel(modelId: string) {
    const m = this.registry.get(modelId);
    if (!m) throw new Error('Model not registered');
    await this.loader.load(m);
    this.registry.update(modelId, { ...m, status: 'loaded' as const });
  }

  async unloadModel(modelId: string) {
    await this.loader.unload(modelId);
    const m = this.registry.get(modelId);
    if (m) this.registry.update(modelId, { ...m, status: 'unloaded' as const });
  }

  listInstalledModels() {
    return this.registry.list();
  }

  getModelStatus(modelId: string) {
    return this.registry.get(modelId);
  }

  async activateModel(modelId: string) {
    await this.lifecycle.activate(modelId);
  }

  async deactivateModel(modelId: string) {
    await this.lifecycle.deactivate(modelId);
  }

  async updateModel(modelId: string, patch: Partial<ModelRecord>) {
    await this.lifecycle.update(modelId, patch);
  }

  async rollbackModel(modelId: string, version: string) {
    await this.versions.rollback(modelId, version);
  }

  async getRuntimeHealth(): Promise<RuntimeHealth> {
    return this.health.getHealth();
  }

  getResourceUsage() {
    return {
      totalMemoryMb: this.resources.estimateMemoryMb(),
      cpuLoadPercent: this.resources.estimateCpuLoad(),
    };
  }

  onEvent(type: string, handler: (e: any) => void) {
    runtimeEvents.on(type, handler);
  }
}
