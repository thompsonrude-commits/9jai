export interface VideoEngine {
  generateFromText(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  generateFromImage(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  edit(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  interpolateFrames(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface VideoModelRequest {
  operation: 'text-to-video' | 'image-to-video' | 'edit' | 'interpolate';
  prompt?: string;
  image?: unknown;
  metadata?: Record<string, unknown>;
}

export interface VideoModelResponse {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'unavailable';
  jobId?: string;
  progress?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface VideoModelAdapter {
  run(request: VideoModelRequest): Promise<VideoModelResponse>;
}

export interface VideoEngineDependencies {
  modelAdapter?: VideoModelAdapter;
}

export class VideoEngineAdapter implements VideoEngine {
  private readonly modelAdapter?: VideoModelAdapter;

  constructor(dependencies: VideoEngineDependencies = {}) {
    this.modelAdapter = dependencies.modelAdapter;
  }

  public async generateFromText(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('text-to-video', request);
  }

  public async generateFromImage(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('image-to-video', request);
  }

  public async edit(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('edit', request);
  }

  public async interpolateFrames(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('interpolate', request);
  }

  private async execute(operation: VideoModelRequest['operation'], request: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.modelAdapter) {
      return {
        status: 'unavailable',
        message: 'No compatible self-hosted video model is available yet.',
        metadata: { operation, modelType: 'self-hosted-open-weight' },
      };
    }

    const response = await this.modelAdapter.run({
      operation,
      prompt: typeof request.prompt === 'string' ? request.prompt : undefined,
      image: request.image,
      metadata: this.normalizeRecord(request.metadata),
    });

    return {
      ...response,
      metadata: {
        ...(response.metadata ?? {}),
        operation,
        modelType: 'self-hosted-open-weight',
      },
    };
  }

  private normalizeRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}
