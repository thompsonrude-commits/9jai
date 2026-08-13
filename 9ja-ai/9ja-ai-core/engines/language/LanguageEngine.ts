export interface LanguageEngine {
  chat(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  reason(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  code(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  summarize(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  write(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface LanguageModelRequest {
  operation: 'chat' | 'reason' | 'code' | 'summarize' | 'write';
  prompt: string;
  context?: Record<string, unknown>;
  memory?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface LanguageModelResponse {
  output: string;
  metadata?: Record<string, unknown>;
}

export interface LanguageModelAdapter {
  complete(request: LanguageModelRequest): Promise<LanguageModelResponse>;
}

export interface LanguageEngineDependencies {
  modelAdapter?: LanguageModelAdapter;
}

export class LanguageEngineAdapter implements LanguageEngine {
  private readonly modelAdapter: LanguageModelAdapter;

  constructor(dependencies: LanguageEngineDependencies = {}) {
    this.modelAdapter = dependencies.modelAdapter ?? new DefaultLanguageModelAdapter();
  }

  public async chat(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('chat', request);
  }

  public async reason(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('reason', request);
  }

  public async code(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('code', request);
  }

  public async summarize(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('summarize', request);
  }

  public async write(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('write', request);
  }

  private async execute(operation: LanguageModelRequest['operation'], request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const modelRequest = this.normalizeRequest(operation, request);
    const response = await this.modelAdapter.complete(modelRequest);

    return {
      output: response.output,
      operation,
      prompt: modelRequest.prompt,
      context: modelRequest.context,
      metadata: {
        ...(modelRequest.metadata ?? {}),
        ...(response.metadata ?? {}),
      },
    };
  }

  private normalizeRequest(operation: LanguageModelRequest['operation'], request: Record<string, unknown>): LanguageModelRequest {
    const prompt = this.extractPrompt(request.prompt);
    const context = this.normalizeRecord(request.context);
    const memory = this.normalizeRecord(request.memory);

    const outgoingContext = Object.keys(memory).length > 0 ? { ...context, memory } : context;

    return {
      operation,
      prompt,
      context: Object.keys(outgoingContext).length > 0 ? outgoingContext : undefined,
      memory: Object.keys(memory).length > 0 ? memory : undefined,
      metadata: this.normalizeRecord(request.metadata),
    };
  }

  private extractPrompt(value: unknown): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    return 'Please help with this request.';
  }

  private normalizeRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

class DefaultLanguageModelAdapter implements LanguageModelAdapter {
  public async complete(_request: LanguageModelRequest): Promise<LanguageModelResponse> {
    // This adapter is a scaffold placeholder — it must NEVER return real-looking output.
    // Throw so any caller that reaches this knows it is not wired to a real provider.
    throw new Error(
      'DefaultLanguageModelAdapter is not connected to any AI provider. ' +
      'Wire a real LanguageModelAdapter before using LanguageEngineAdapter in production.'
    );
  }
}
