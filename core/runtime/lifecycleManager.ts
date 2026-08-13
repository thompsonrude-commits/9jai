import type { ModelRecord } from './types';
import { ModelRegistry } from './modelRegistry';
import { ModelLoader } from './modelLoader';
import { runtimeEvents } from './events';

export class LifecycleManager {
  constructor(private registry: ModelRegistry, private loader: ModelLoader) {}

  async install(model: ModelRecord): Promise<void> {
    this.registry.register(model);
    this.registry.update(model.id, { status: 'inactive' as const, installedAt: model.installedAt ?? new Date().toISOString() });
  }

  async activate(modelId: string): Promise<void> {
    const m = this.registry.get(modelId);
    if (!m) throw new Error('Model not registered');
    if (m.status === 'active') return;
    if (!this.loader.isLoaded(modelId)) {
      await this.loader.load(m);
    }
    this.registry.update(modelId, { ...m, status: 'active', installedAt: m.installedAt ?? new Date().toISOString() });
    runtimeEvents.emitEvent({ type: 'ModelActivated', modelId });
  }

  async deactivate(modelId: string): Promise<void> {
    if (this.loader.isLoaded(modelId)) {
      await this.loader.unload(modelId);
    }
    const m = this.registry.get(modelId);
    if (m) {
      this.registry.update(modelId, { ...m, status: 'inactive', installedAt: m.installedAt });
      runtimeEvents.emitEvent({ type: 'ModelDeactivated', modelId });
    }
  }

  async uninstall(modelId: string): Promise<void> {
    await this.deactivate(modelId);
    this.registry.unregister(modelId);
  }

  async update(modelId: string, patch: Partial<ModelRecord>): Promise<void> {
    this.registry.update(modelId, patch);
    runtimeEvents.emitEvent({ type: 'ModelUpdated', modelId });
  }

  async rollback(modelId: string, version: string): Promise<void> {
    const m = this.registry.get(modelId);
    if (!m) throw new Error('Model not registered');
    this.registry.update(modelId, { ...m, version, status: 'inactive' });
    runtimeEvents.emitEvent({ type: 'ModelUpdated', modelId });
  }

  async shutdown(): Promise<void> {
    runtimeEvents.emitEvent({ type: 'RuntimeStopped' });
  }
}
