import { AIRequest, AIResponse, EngineKind } from '../types';
import { Logger } from '../logging/Logger';
import { InferenceEngine } from '../inference/InferenceEngine';

export interface OrchestratorEngineAdapter {
  kind: EngineKind;
  execute?(request: AIRequest): Promise<unknown>;
  stream?(request: AIRequest): AsyncIterable<unknown>;
  healthCheck?(): Promise<{ healthy: boolean; details?: string }>;
}

export interface OrchestratorDependencies {
  logger: Logger;
  engines?: Partial<Record<EngineKind, OrchestratorEngineAdapter>>;
  runtime?: InferenceEngine;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class AIOrchestrator {
  private readonly engines = new Map<EngineKind, OrchestratorEngineAdapter>();
  private readonly pendingRequests: AIRequest[] = [];
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(private readonly dependencies: OrchestratorDependencies) {
    this.maxRetries = dependencies.maxRetries ?? 2;
    this.retryDelayMs = dependencies.retryDelayMs ?? 100;

    for (const [kind, engine] of Object.entries(dependencies.engines ?? {}) as Array<[EngineKind, OrchestratorEngineAdapter]>) {
      this.registerEngine(kind, engine);
    }
  }

  public registerEngine(kind: EngineKind, engine: OrchestratorEngineAdapter): void {
    this.engines.set(kind, engine);
    this.dependencies.logger.info('Orchestrator engine registered', { kind });
  }

  public async handleRequest(request: AIRequest): Promise<AIResponse> {
    const normalized = this.normalizeRequest(request);
    const engine = this.resolveEngine(normalized.kind);

    this.dependencies.logger.info('AI request received by orchestrator', {
      requestId: normalized.id,
      kind: normalized.kind,
      operation: normalized.operation,
      stream: normalized.stream,
    });

    try {
      if (this.dependencies.runtime) {
        const runtimeResponse = await this.dependencies.runtime.executeRequest(normalized);
        return {
          ...runtimeResponse,
          metadata: {
            ...(runtimeResponse.metadata ?? {}),
            orchestrator: 'model-runtime',
          },
        };
      }

      const result = await this.executeWithRetries(normalized, engine);
      return this.buildResponse(normalized, result, 'completed', { attempts: this.maxRetries + 1 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown orchestrator failure';
      await this.handleFailure(normalized.id, error instanceof Error ? error : new Error(message));
      return this.buildResponse(normalized, undefined, 'failed', { attempts: this.maxRetries + 1, error: message });
    }
  }

  public async streamRequest(request: AIRequest): Promise<AsyncIterable<AIResponse>> {
    const normalized = this.normalizeRequest(request);
    const engine = this.resolveEngine(normalized.kind);

    async function* streamingGenerator(): AsyncGenerator<AIResponse> {
      yield {
        requestId: normalized.id,
        status: 'accepted',
        engine: normalized.kind,
        operation: normalized.operation,
        metadata: { stream: true, stage: 'queued' },
      };

      if (engine.stream) {
        let index = 0;
        for await (const chunk of engine.stream(normalized)) {
          index += 1;
          yield {
            requestId: normalized.id,
            status: 'completed',
            engine: normalized.kind,
            operation: normalized.operation,
            data: chunk,
            metadata: { stream: true, chunkIndex: index },
          };
        }
        return;
      }

      const result = await this.handleRequest(normalized);
      yield result;
    }

    return streamingGenerator();
  }

  public async enqueueRequest(request: AIRequest): Promise<AIResponse> {
    const normalized = this.normalizeRequest(request);
    this.pendingRequests.push(normalized);
    this.dependencies.logger.info('AI request queued', { requestId: normalized.id, kind: normalized.kind, queueLength: this.pendingRequests.length });

    void this.processQueue().catch((error) => this.handleFailure(normalized.id, error));

    return {
      requestId: normalized.id,
      status: 'queued',
      engine: normalized.kind,
      operation: normalized.operation,
      metadata: { queueLength: this.pendingRequests.length, queued: true },
    };
  }

  public async handleFailure(requestId: string, error: Error): Promise<void> {
    this.dependencies.logger.error('Orchestrator request failed', { requestId, error: error.message });
  }

  private async executeWithRetries(request: AIRequest, engine: OrchestratorEngineAdapter): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt += 1) {
      try {
        const execution = await this.executeEngine(request, engine);
        return execution;
      } catch (error) {
        lastError = error;
        this.dependencies.logger.warn('Orchestrator retrying request', {
          requestId: request.id,
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });

        if (attempt <= this.maxRetries) {
          await this.delay(this.retryDelayMs * attempt);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Unknown orchestrator execution failure');
  }

  private async executeEngine(request: AIRequest, engine: OrchestratorEngineAdapter): Promise<unknown> {
    if (engine.execute) {
      return engine.execute(request);
    }

    if (engine.stream) {
      const chunks: unknown[] = [];
      for await (const chunk of engine.stream(request)) {
        chunks.push(chunk);
      }
      return chunks;
    }

    throw new Error(`No execution handler registered for engine ${engine.kind}`);
  }

  private resolveEngine(kind: EngineKind): OrchestratorEngineAdapter {
    const engine = this.engines.get(kind);
    if (!engine) {
      throw new Error(`No engine registered for ${kind}`);
    }
    return engine;
  }

  private normalizeRequest(request: AIRequest): AIRequest {
    const normalizedKind = request.kind ?? this.detectKind(request);
    return {
      ...request,
      id: request.id || `request-${Date.now()}`,
      kind: normalizedKind,
      operation: request.operation || this.defaultOperation(normalizedKind),
      stream: request.stream ?? false,
      priority: request.priority ?? 'normal',
      metadata: request.metadata ?? {},
    };
  }

  private detectKind(request: AIRequest): EngineKind {
    const operation = request.operation?.toLowerCase() ?? '';
    if (operation.includes('image') || operation.includes('generation')) return 'image';
    if (operation.includes('video')) return 'video';
    if (operation.includes('speech') || operation.includes('transcribe') || operation.includes('tts')) return 'speech';
    if (operation.includes('translate') || operation.includes('localize')) return 'translation';
    if (operation.includes('ocr') || operation.includes('scan') || operation.includes('document')) return 'ocr';
    if (operation.includes('vision') || operation.includes('detect') || operation.includes('scene')) return 'vision';
    if (operation.includes('memory') || operation.includes('context')) return 'memory';
    return 'language';
  }

  private defaultOperation(kind: EngineKind): string {
    switch (kind) {
      case 'language': return 'chat';
      case 'vision': return 'understand';
      case 'image': return 'generate';
      case 'video': return 'generate';
      case 'speech': return 'transcribe';
      case 'translation': return 'translate';
      case 'memory': return 'store';
      case 'ocr': return 'extract';
    }
  }

  private buildResponse(request: AIRequest, data: unknown, status: AIResponse['status'], metadata: Record<string, unknown>): AIResponse {
    return {
      requestId: request.id,
      status,
      engine: request.kind,
      operation: request.operation,
      data,
      metadata: {
        ...request.metadata,
        ...metadata,
      },
    };
  }

  private async processQueue(): Promise<void> {
    while (this.pendingRequests.length > 0) {
      const next = this.pendingRequests.shift();
      if (!next) break;
      await this.handleRequest(next);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
