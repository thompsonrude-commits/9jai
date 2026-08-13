import type { ModelRecord } from './types';
import { runtimeEvents } from './events';

export class ModelLoader {
  private loaded = new Set<string>();

  async load(model: ModelRecord): Promise<void> {
    if (this.loaded.has(model.id)) {
      throw new Error(`Model ${model.id} already loaded`);
    }
    if (!model.id || !model.version) throw new Error('Invalid model descriptor');
    if (!Array.isArray(model.capabilities) || model.capabilities.length === 0) {
      throw new Error(`Model ${model.id} must declare at least one capability`);
    }
    await new Promise((r) => setTimeout(r, 10));
    this.loaded.add(model.id);
    runtimeEvents.emitEvent({ type: 'ModelLoaded', modelId: model.id });
  }

  async unload(modelId: string): Promise<void> {
    if (!this.loaded.has(modelId)) return;
    await new Promise((r) => setTimeout(r, 5));
    this.loaded.delete(modelId);
    runtimeEvents.emitEvent({ type: 'ModelUnloaded', modelId });
  }

  isLoaded(modelId: string): boolean {
    return this.loaded.has(modelId);
  }
}
