export interface SpeechEngine {
  transcribe(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  synthesize(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  converse(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  streamAudio(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface SpeechModelRequest {
  operation: 'transcribe' | 'synthesize' | 'converse' | 'stream';
  audio?: unknown;
  text?: string;
  language?: string;
  stream?: boolean;
  interruption?: boolean;
  conversationMode?: boolean;
  vad?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SpeechModelResponse {
  text?: string;
  audio?: string;
  stream?: boolean;
  interruption?: boolean;
  conversationMode?: boolean;
  vad?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SpeechModelAdapter {
  run(request: SpeechModelRequest): Promise<SpeechModelResponse>;
}

export interface SpeechEngineDependencies {
  modelAdapter?: SpeechModelAdapter;
}

export class SpeechEngineAdapter implements SpeechEngine {
  private readonly modelAdapter: SpeechModelAdapter;

  constructor(dependencies: SpeechEngineDependencies = {}) {
    this.modelAdapter = dependencies.modelAdapter ?? new DefaultSpeechModelAdapter();
  }

  public async transcribe(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('transcribe', request);
  }

  public async synthesize(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('synthesize', request);
  }

  public async converse(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('converse', request);
  }

  public async streamAudio(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('stream', request);
  }

  private async execute(operation: SpeechModelRequest['operation'], request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const normalized = this.normalizeRequest(operation, request);
    const response = await this.modelAdapter.run(normalized);

    return {
      operation,
      text: response.text,
      audio: response.audio,
      stream: response.stream ?? normalized.stream ?? false,
      interruption: response.interruption ?? normalized.interruption ?? false,
      conversationMode: response.conversationMode ?? normalized.conversationMode ?? false,
      vad: response.vad ?? normalized.vad ?? false,
      metadata: {
        ...(response.metadata ?? {}),
        language: normalized.language ?? 'und',
        ...(normalized.metadata ?? {}),
      },
    };
  }

  private normalizeRequest(operation: SpeechModelRequest['operation'], request: Record<string, unknown>): SpeechModelRequest {
    return {
      operation,
      audio: request.audio,
      text: typeof request.text === 'string' ? request.text : undefined,
      language: typeof request.language === 'string' ? request.language : 'und',
      stream: request.stream === true,
      interruption: request.interruption === true,
      conversationMode: request.conversationMode === true,
      vad: request.vad === true,
      metadata: this.normalizeRecord(request.metadata),
    };
  }

  private normalizeRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

class DefaultSpeechModelAdapter implements SpeechModelAdapter {
  public async run(request: SpeechModelRequest): Promise<SpeechModelResponse> {
    return {
      text: request.operation === 'synthesize' ? undefined : 'default speech output',
      audio: request.operation === 'synthesize' ? 'default-audio' : undefined,
      stream: request.stream ?? false,
      interruption: request.interruption ?? false,
      conversationMode: request.conversationMode ?? false,
      vad: request.vad ?? false,
      metadata: {
        source: 'default-speech-model',
      },
    };
  }
}
