import { modelEvents } from './events';
import type { ModelDescriptor, ModelRegistryUpdate, ModelBenchmark } from './types';

export class ModelRegistry {
  private readonly models = new Map<string, ModelDescriptor>();
  private readonly benchmarks = new Map<string, ModelBenchmark[]>();

  register(model: ModelDescriptor): void {
    if (this.models.has(model.id)) {
      throw new Error(`Model with id ${model.id} already registered`);
    }

    const registered: ModelDescriptor = {
      ...model,
      installedAt: model.installedAt ?? new Date().toISOString(),
      status: model.status ?? 'registered',
      health: model.health ?? {
        status: 'unknown',
        errorCount: 0,
        validationStatus: 'pending',
        availability: false,
      },
    };

    this.models.set(registered.id, registered);
    modelEvents.emitEvent({ type: 'ModelRegistered', model: registered });
  }

  update(id: string, patch: ModelRegistryUpdate): ModelDescriptor {
    const existing = this.models.get(id);
    if (!existing) {
      throw new Error(`Model ${id} not found`);
    }

    const { health, ...rest } = patch;
    const mergedHealth = health
      ? ({
          ...existing.health,
          ...health,
          status: health.status ?? existing.health.status,
        } as ModelDescriptor['health'])
      : existing.health;

    const updated: ModelDescriptor = {
      ...existing,
      ...rest,
      health: mergedHealth,
      lastValidatedAt: patch.lastValidatedAt ?? existing.lastValidatedAt,
      lastUsedAt: patch.lastUsedAt ?? existing.lastUsedAt,
    };

    this.models.set(id, updated);
    modelEvents.emitEvent({ type: 'ModelUpdated', modelId: id, patch: patch as Partial<ModelDescriptor> });
    return updated;
  }

  get(id: string): ModelDescriptor | undefined {
    return this.models.get(id);
  }

  list(filter?: Partial<Pick<ModelDescriptor, 'category' | 'provider' | 'status'>>): ModelDescriptor[] {
    const all = Array.from(this.models.values());
    if (!filter) return all;
    return all.filter((model) => {
      if (filter.category && model.category !== filter.category) return false;
      if (filter.provider && model.provider !== filter.provider) return false;
      if (filter.status && model.status !== filter.status) return false;
      return true;
    });
  }

  unregister(id: string): boolean {
    const existed = this.models.delete(id);
    if (existed) {
      modelEvents.emitEvent({ type: 'ModelDisabled', modelId: id });
      this.benchmarks.delete(id);
    }
    return existed;
  }

  setStatus(id: string, status: ModelDescriptor['status']): ModelDescriptor {
    return this.update(id, { status });
  }

  markUsed(id: string): ModelDescriptor {
    return this.update(id, { lastUsedAt: new Date().toISOString() });
  }

  recordHealth(id: string, health: ModelDescriptor['health']): ModelDescriptor {
    return this.update(id, { health });
  }

  recordBenchmark(id: string, benchmark: ModelBenchmark): void {
    const records = this.benchmarks.get(id) ?? [];
    records.push(benchmark);
    this.benchmarks.set(id, records);
    modelEvents.emitEvent({ type: 'ModelBenchmarkRecorded', modelId: id, benchmark });
  }

  getBenchmarks(id: string): ModelBenchmark[] {
    return [...(this.benchmarks.get(id) ?? [])];
  }
}
