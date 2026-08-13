import type { ModelMetadata, ModelRecord, ModelStatus } from './types';
import { runtimeEvents } from './events';

export class ModelRegistry {
  private readonly models = new Map<string, ModelRecord>();

  register(metadata: ModelMetadata) {
    if (this.models.has(metadata.id)) {
      throw new Error(`Model with id ${metadata.id} already registered`);
    }
    const record: ModelRecord = {
      ...metadata,
      status: 'registered',
      lastUpdated: new Date().toISOString(),
    };
    this.models.set(record.id, record);
    runtimeEvents.emitEvent({ type: 'ModelRegistered', model: record });
  }

  update(id: string, patch: Partial<ModelRecord>) {
    const existing = this.models.get(id);
    if (!existing) throw new Error('Model not found');
    const updated: ModelRecord = {
      ...existing,
      ...patch,
      lastUpdated: new Date().toISOString(),
    };
    this.models.set(id, updated);
    runtimeEvents.emitEvent({ type: 'ModelUpdated', modelId: id });
  }

  list(): ModelRecord[] {
    return [...this.models.values()];
  }

  listByStatus(status: ModelStatus): ModelRecord[] {
    return [...this.models.values()].filter((model) => model.status === status);
  }

  get(id: string): ModelRecord | undefined {
    return this.models.get(id);
  }

  unregister(id: string) {
    const existed = this.models.delete(id);
    if (existed) {
      runtimeEvents.emitEvent({ type: 'ModelUnregistered', modelId: id });
    }
  }
}
