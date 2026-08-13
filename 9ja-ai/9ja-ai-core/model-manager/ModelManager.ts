import { EngineKind, ModelDescriptor, ModelRuntimeState, RuntimeSelectionCriteria } from '../types';
import { ModelRegistry } from './ModelRegistry';

export class ModelManager {
  private readonly registry = new ModelRegistry();
  private readonly runtimeStates = new Map<string, ModelRuntimeState>();

  public registerModel(model: ModelDescriptor): ModelDescriptor {
    return this.registry.register(model);
  }

  public discoverModels(models: ModelDescriptor[]): ModelDescriptor[] {
    return models.map((model) => this.registerModel(model));
  }

  public listModels(): ModelDescriptor[] {
    return this.registry.all();
  }

  public getModel(modelId: string): ModelDescriptor | undefined {
    return this.registry.resolve(modelId);
  }

  public getRuntimeState(modelId: string): ModelRuntimeState | undefined {
    return this.runtimeStates.get(modelId);
  }

  public listRuntimeStates(): ModelRuntimeState[] {
    return Array.from(this.runtimeStates.values());
  }

  public markRuntimeState(modelId: string, state: Partial<ModelRuntimeState>): void {
    const existing = this.runtimeStates.get(modelId) ?? {
      modelId,
      status: 'registered',
      health: 'degraded',
      capabilities: this.getModel(modelId)?.capabilities ?? [],
    };

    this.runtimeStates.set(modelId, { ...existing, ...state, modelId, capabilities: state.capabilities ?? existing.capabilities });
  }

  public selectModel(criteria: RuntimeSelectionCriteria): ModelDescriptor | undefined {
    const candidates = this.registry.findByCapabilities(criteria.requiredCapabilities ?? [criteria.kind]);
    const enabledCandidates = candidates.filter((model) => model.enabled);

    if (criteria.preferredModelIds?.length) {
      const preferred = enabledCandidates.find((model) => criteria.preferredModelIds?.includes(model.id));
      if (preferred) {
        return preferred;
      }
    }

    const healthyCandidates = criteria.preferHealthy
      ? enabledCandidates.filter((model) => this.getRuntimeState(model.id)?.health === 'healthy')
      : enabledCandidates;

    return healthyCandidates[0] ?? enabledCandidates[0];
  }

  public replaceModel(existingModelId: string, replacementModel: ModelDescriptor): ModelDescriptor {
    this.registry.remove(existingModelId);
    this.runtimeStates.delete(existingModelId);
    return this.registerModel(replacementModel);
  }

  public capabilitySummary(): Record<EngineKind, number> {
    const summary = {} as Record<EngineKind, number>;
    for (const kind of ['language', 'vision', 'image', 'video', 'speech', 'translation', 'memory', 'ocr'] as EngineKind[]) {
      summary[kind] = this.registry.all().filter((model) => model.enabled && model.capabilities.includes(kind)).length;
    }
    return summary;
  }
}
