export interface ImageEngine {
  generate(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  edit(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  inpaint(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  outpaint(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  upscale(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  removeBackground(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  renderText(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface ImageModelRequest {
  operation: 'generate' | 'edit' | 'inpaint' | 'outpaint' | 'upscale' | 'removeBackground' | 'renderText';
  prompt?: string;
  image?: unknown;
  text?: string;
  instructions?: string;
  metadata?: Record<string, unknown>;
}

export interface ImageModelResponse {
  imageUrl?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

export interface ImageModelAdapter {
  run(request: ImageModelRequest): Promise<ImageModelResponse>;
}

export interface ImageEngineDependencies {
  modelAdapter?: ImageModelAdapter;
}

export class ImageEngineAdapter implements ImageEngine {
  private readonly modelAdapter: ImageModelAdapter;

  constructor(dependencies: ImageEngineDependencies = {}) {
    this.modelAdapter = dependencies.modelAdapter ?? new DefaultImageModelAdapter();
  }

  public async generate(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('generate', request);
  }

  public async edit(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('edit', request);
  }

  public async inpaint(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('inpaint', request);
  }

  public async outpaint(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('outpaint', request);
  }

  public async upscale(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('upscale', request);
  }

  public async removeBackground(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('removeBackground', request);
  }

  public async renderText(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('renderText', request);
  }

  private async execute(operation: ImageModelRequest['operation'], request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const modelRequest: ImageModelRequest = {
      operation,
      prompt: typeof request.prompt === 'string' ? request.prompt : undefined,
      image: request.image,
      text: typeof request.text === 'string' ? request.text : undefined,
      instructions: typeof request.instructions === 'string' ? request.instructions : undefined,
      metadata: this.normalizeRecord(request.metadata),
    };

    const response = await this.modelAdapter.run(modelRequest);

    return {
      operation,
      imageUrl: response.imageUrl,
      metadata: {
        ...(response.metadata ?? {}),
        ...(modelRequest.metadata ?? {}),
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

class DefaultImageModelAdapter implements ImageModelAdapter {
  public async run(request: ImageModelRequest): Promise<ImageModelResponse> {
    return {
      imageUrl: `image://${request.operation}`,
      operation: request.operation,
      metadata: {
        source: 'default-image-model',
      },
    };
  }
}
