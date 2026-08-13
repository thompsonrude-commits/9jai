/**
 * AIService.ts
 *
 * Top-level entry point for all AI capabilities on the 9JA AI platform.
 */

import { DefaultAIOrchestrator, type AIOrchestrator } from '../orchestrator/AIOrchestrator';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import type { AIConfig } from '../config/AIConfig';
import type { AIRequest, AIResponse } from '../utils/types';
import { DefaultLanguageEngine } from '../engines/language/LanguageEngine';
import { DefaultMemoryEngine } from '../engines/memory/MemoryEngine';

export interface IAIService {
  initialize(config: AIConfig): Promise<void>;
  process(request: AIRequest): Promise<AIResponse>;
  getRegistry(): ProviderRegistry;
  getOrchestrator(): AIOrchestrator;
  shutdown(): Promise<void>;
}

export class DefaultAIService implements IAIService {
  private registry = new ProviderRegistry();
  private orchestrator = new DefaultAIOrchestrator();
  private languageEngine = new DefaultLanguageEngine();
  private memoryEngine = new DefaultMemoryEngine();

  async initialize(config: AIConfig): Promise<void> {
    this.registry = new ProviderRegistry();
    this.orchestrator = new DefaultAIOrchestrator();
    this.orchestrator.registerEngine('language', this.languageEngine as any);
    this.orchestrator.registerEngine('memory', this.memoryEngine as any);
    this.orchestrator.initialize({ defaultProvider: config.defaultProvider, enableMemory: true, enableLogging: config.enableTelemetry ?? false });
  }

  async process(request: AIRequest): Promise<AIResponse> {
    const response = await this.orchestrator.process({
      type: request.type,
      prompt: request.prompt ?? request.input?.toString?.(),
      input: request.input,
      language: request.language,
      requestId: request.requestId,
      userId: request.userId,
      sessionId: request.sessionId,
      options: request.options,
    });

    return {
      ...response,
      requestId: request.requestId,
      type: request.type,
      text: response.text ?? response.error?.message ?? 'No response generated',
    };
  }

  getRegistry(): ProviderRegistry {
    return this.registry;
  }

  getOrchestrator(): AIOrchestrator {
    return this.orchestrator;
  }

  async shutdown(): Promise<void> {
    await this.orchestrator.shutdown();
  }
}

export function createAIService(): IAIService {
  return new DefaultAIService();
}
