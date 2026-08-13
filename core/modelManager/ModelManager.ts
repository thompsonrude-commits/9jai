import type {
  ModelManagerOptions,
  ModelDescriptor,
  ModelDiscoveryOptions,
  ModelSelectionCriteria,
  ModelValidationResult,
} from './types';
import { ModelRegistry } from './ModelRegistry';
import { ModelDiscovery } from './ModelDiscovery';
import { ModelValidator } from './ModelValidator';
import { ModelSelector } from './ModelSelector';
import { ResourceMonitor } from './ResourceMonitor';
import { modelEvents } from './events';

export class ModelManager {
  private readonly registry = new ModelRegistry();
  private readonly validator: ModelValidator;
  private readonly discovery: ModelDiscovery;
  private readonly selector = new ModelSelector();
  private readonly resources = new ResourceMonitor();
  private readonly discoveryPaths: string[];

  constructor(private readonly options: ModelManagerOptions = {}) {
    this.validator = new ModelValidator(options.securityProvider);
    this.discovery = new ModelDiscovery(this.validator);
    this.discoveryPaths = options.discoveryPaths ?? ['./models'];
  }

  async discoverModels(): Promise<{ discovered: ModelDescriptor[]; invalid: Array<{ path: string; errors: string[] }> }> {
    const result = await this.discovery.discover({
      searchPaths: this.discoveryPaths,
      recursive: true,
    });

    for (const model of result.discovered) {
      try {
        await this.registerModel(model);
      } catch (error) {
        result.invalid.push({ path: model.filePath, errors: [String(error)] });
      }
    }

    return result;
  }

  async registerModel(model: ModelDescriptor): Promise<void> {
    if (!model.lastValidatedAt) {
      const validation = await this.validator.validate(model);
      if (!validation.valid) {
        throw new Error(`Model validation failed before registration: ${validation.errors.join('; ')}`);
      }
    }

    this.registry.register({
      ...model,
      status: 'registered',
      health: model.health ?? {
        status: 'unknown',
        errorCount: 0,
        validationStatus: 'pending',
        availability: false,
      },
    });
    modelEvents.emitEvent({ type: 'ModelRegistered', model });
  }

  async validateModel(modelId: string): Promise<ModelValidationResult> {
    const model = this.registry.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    const result = await this.validator.validate(model);
    const healthUpdate = {
      status: result.valid ? 'healthy' : 'degraded',
      validationStatus: result.valid ? 'passed' : 'failed',
      lastFailure: result.valid ? undefined : new Date().toISOString(),
      lastSuccessfulExecution: result.valid ? new Date().toISOString() : model.health?.lastSuccessfulExecution,
      errorCount: result.valid ? model.health?.errorCount ?? 0 : (model.health?.errorCount ?? 0) + 1,
      availability: result.valid,
      validationErrors: result.errors,
    };

    const updated = this.registry.recordHealth(modelId, healthUpdate as any);
    this.registry.setStatus(modelId, result.valid ? 'validated' : 'failed');
    modelEvents.emitEvent({ type: 'ModelValidated', modelId, result });
    if (result.valid) {
      this.registry.setStatus(modelId, 'ready');
      modelEvents.emitEvent({ type: 'ModelReady', modelId });
    }
    return result;
  }

  getModel(modelId: string): ModelDescriptor | undefined {
    return this.registry.get(modelId);
  }

  listModels(filter?: Partial<Pick<ModelDescriptor, 'category' | 'provider' | 'status'>>): ModelDescriptor[] {
    return this.registry.list(filter);
  }

  selectModel(criteria: ModelSelectionCriteria): ModelDescriptor | undefined {
    const eligible = this.registry.list().filter((model) => model.status !== 'disabled');
    const selected = this.selector.select(eligible, criteria);
    if (selected) {
      this.registry.markUsed(selected.id);
      modelEvents.emitEvent({ type: 'ModelSelected', modelId: selected.id, criteria });
    }
    return selected;
  }

  async updateModel(modelId: string, patch: Partial<ModelDescriptor>): Promise<ModelDescriptor> {
    const updated = this.registry.update(modelId, {
      ...patch,
      lastValidatedAt: patch.lastValidatedAt ?? undefined,
      lastUsedAt: patch.lastUsedAt ?? undefined,
    });
    modelEvents.emitEvent({ type: 'ModelUpdated', modelId, patch });
    return updated;
  }

  deprecateModel(modelId: string): ModelDescriptor {
    const updated = this.registry.setStatus(modelId, 'deprecated');
    modelEvents.emitEvent({ type: 'ModelDeprecated', modelId });
    return updated;
  }

  disableModel(modelId: string): boolean {
    const model = this.registry.get(modelId);
    if (!model) return false;
    this.registry.setStatus(modelId, 'disabled');
    modelEvents.emitEvent({ type: 'ModelDisabled', modelId });
    return true;
  }

  async benchmarkModel(modelId: string, benchmark: import('./types').ModelBenchmark): Promise<void> {
    const model = this.registry.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    this.registry.recordBenchmark(modelId, benchmark);
  }

  async checkResourceSupport(modelId: string): Promise<boolean> {
    const model = this.registry.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    return this.resources.canSupport(model.requiredHardware);
  }

  getModelBenchmarks(modelId: string) {
    return this.registry.getBenchmarks(modelId);
  }

  getResourceStatus() {
    return this.resources.getStatus();
  }

  async discoverAndRegister(): Promise<void> {
    const result = await this.discoverModels();
    for (const model of result.discovered) {
      if (model.status === 'discovered') {
        await this.validateModel(model.id);
      }
    }
  }
}
