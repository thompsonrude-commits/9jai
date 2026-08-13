import { EngineKind, ModelDescriptor } from '../types';

export class ModelRegistry {
  private readonly registry = new Map<string, ModelDescriptor>();

  public register(model: ModelDescriptor): ModelDescriptor {
    this.registry.set(model.id, model);
    return model;
  }

  public resolve(modelId: string): ModelDescriptor | undefined {
    return this.registry.get(modelId);
  }

  public all(): ModelDescriptor[] {
    return Array.from(this.registry.values());
  }

  public remove(modelId: string): boolean {
    return this.registry.delete(modelId);
  }

  public findByCapabilities(capabilities: EngineKind[]): ModelDescriptor[] {
    return this.all().filter((model) => model.enabled && capabilities.every((capability) => model.capabilities.includes(capability)));
  }
}
