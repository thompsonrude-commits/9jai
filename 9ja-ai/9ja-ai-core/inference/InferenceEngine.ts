import { AIRequest, AIResponse, EngineKind, InferenceJob, ModelDescriptor, RuntimeSelectionCriteria } from '../types';
import { ModelManager } from '../model-manager/ModelManager';

export interface InferenceEngineConfig {
  maxConcurrentJobs: number;
  gpuEnabled: boolean;
  distributedMode: 'single-node' | 'cluster';
}

export interface InferenceRuntimeAdapter {
  loadModel(model: ModelDescriptor): Promise<void>;
  unloadModel(modelId: string): Promise<void>;
  runInference(job: InferenceJob, model: ModelDescriptor): Promise<unknown>;
}

export class InferenceEngine {
  private readonly queue: InferenceJob[] = [];
  private readonly activeJobs = new Map<string, InferenceJob>();

  constructor(
    private readonly config: InferenceEngineConfig,
    private readonly modelManager: ModelManager = new ModelManager(),
    private readonly runtimeAdapter?: InferenceRuntimeAdapter,
  ) {}

  public registerModel(model: ModelDescriptor): ModelDescriptor {
    return this.modelManager.registerModel(model);
  }

  public discoverModels(models: ModelDescriptor[]): ModelDescriptor[] {
    return this.modelManager.discoverModels(models);
  }

  public async loadModel(model: ModelDescriptor): Promise<void> {
    this.modelManager.markRuntimeState(model.id, {
      modelId: model.id,
      status: 'loading',
      health: 'degraded',
      capabilities: model.capabilities,
      details: 'loading model into runtime',
    });

    await this.runtimeAdapter?.loadModel(model);

    this.modelManager.markRuntimeState(model.id, {
      modelId: model.id,
      status: 'ready',
      health: 'healthy',
      capabilities: model.capabilities,
      loadedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      details: 'model ready for inference',
    });
  }

  public async checkHealth(modelId: string): Promise<{ modelId: string; healthy: boolean; details: string }> {
    const state = this.modelManager.getRuntimeState(modelId);
    if (!state) {
      return { modelId, healthy: false, details: 'model not registered' };
    }

    return {
      modelId,
      healthy: state.health === 'healthy',
      details: state.details ?? `${state.status}`,
    };
  }

  public async allocateResources(modelId: string): Promise<void> {
    const model = this.modelManager.getModel(modelId);
    if (!model) {
      throw new Error(`Cannot allocate resources for unknown model ${modelId}`);
    }

    const resourceBudget = model.capabilities.length > 3 ? 2 : 1;
    this.modelManager.markRuntimeState(modelId, {
      modelId,
      status: 'ready',
      health: 'healthy',
      capabilities: model.capabilities,
      lastCheckedAt: new Date().toISOString(),
      details: `allocated ${resourceBudget} resource units for ${model.family}`,
    });
  }

  public async queueJob(job: InferenceJob): Promise<InferenceJob> {
    this.queue.push(job);
    await this.drainQueue();
    return { ...job, status: 'queued', updatedAt: new Date().toISOString() };
  }

  public async runJob(job: InferenceJob): Promise<InferenceJob> {
    const model = this.modelManager.getModel(job.modelId);
    if (!model) {
      throw new Error(`Cannot run job for unknown model ${job.modelId}`);
    }

    if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
      return this.queueJob(job);
    }

    this.activeJobs.set(job.id, { ...job, status: 'running', updatedAt: new Date().toISOString() });

    try {
      await this.runtimeAdapter?.runInference(job, model);
      const completed = { ...job, status: 'completed' as const, updatedAt: new Date().toISOString() };
      this.activeJobs.delete(job.id);
      return completed;
    } catch (error) {
      this.activeJobs.delete(job.id);
      throw error;
    }
  }

  public async selectModel(criteria: RuntimeSelectionCriteria): Promise<ModelDescriptor | undefined> {
    return this.modelManager.selectModel(criteria);
  }

  public async replaceModel(existingModelId: string, replacementModel: ModelDescriptor): Promise<ModelDescriptor> {
    return this.modelManager.replaceModel(existingModelId, replacementModel);
  }

  public async prepareRequest(request: AIRequest, model?: ModelDescriptor): Promise<InferenceJob> {
    const selectedModel = model ?? (await this.selectModel({ kind: request.kind, requiredCapabilities: [request.kind], preferHealthy: true }));
    if (!selectedModel) {
      throw new Error(`No enabled model available for ${request.kind}`);
    }

    await this.loadModel(selectedModel);
    await this.allocateResources(selectedModel.id);

    const job: InferenceJob = {
      id: `job-${request.id}`,
      requestId: request.id,
      modelId: selectedModel.id,
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return job;
  }

  public async executeRequest(request: AIRequest): Promise<AIResponse> {
    const model = await this.selectModel({ kind: request.kind, requiredCapabilities: [request.kind], preferHealthy: true });
    if (!model) {
      return {
        requestId: request.id,
        status: 'failed',
        engine: request.kind,
        operation: request.operation,
        error: 'No enabled model available',
      };
    }

    await this.loadModel(model);
    await this.allocateResources(model.id);

    const job = await this.prepareRequest(request, model);
    const queuedJob = await this.queueJob(job);

    return {
      requestId: request.id,
      status: queuedJob.status === 'queued' ? 'queued' : 'completed',
      engine: request.kind,
      operation: request.operation,
      data: {
        modelId: model.id,
        jobId: queuedJob.id,
      },
      metadata: {
        runtime: 'self-hosted-model-runtime',
        capabilities: model.capabilities,
      },
    };
  }

  public queueLength(): number {
    return this.queue.length;
  }

  private async drainQueue(): Promise<void> {
    while (this.queue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
      const next = this.queue.shift();
      if (!next) {
        break;
      }

      await this.runJob(next);
    }
  }
}
