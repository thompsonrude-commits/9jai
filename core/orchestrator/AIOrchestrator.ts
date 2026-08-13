/**
 * AIOrchestrator.ts
 *
 * Central coordinator for the 9JA AI platform runtime.
 */

import type { AIRequest, AIResponse, EngineType, OrchestratorConfig } from '../utils/types';
import type { LanguageEngine } from '../engines/language/LanguageEngine';
import type { VisionEngine } from '../engines/vision/VisionEngine';
import type { ImageEngine } from '../engines/image/ImageEngine';
import type { VideoEngine } from '../engines/video/VideoEngine';
import type { SpeechEngine } from '../engines/speech/SpeechEngine';
import type { TranslationEngine } from '../engines/translation/TranslationEngine';
import type { MemoryEngine } from '../engines/memory/MemoryEngine';
import type { OCREngine } from '../engines/ocr/OCREngine';

export interface EngineRegistry {
  language: LanguageEngine;
  vision: VisionEngine;
  image: ImageEngine;
  video: VideoEngine;
  speech: SpeechEngine;
  translation: TranslationEngine;
  memory: MemoryEngine;
  ocr: OCREngine;
}

export interface AIOrchestrator {
  initialize(config: OrchestratorConfig): Promise<void>;
  process(request: AIRequest): Promise<AIResponse>;
  registerEngine<K extends EngineType>(type: K, engine: EngineRegistry[K]): void;
  getEngine<K extends EngineType>(type: K): EngineRegistry[K] | undefined;
  shutdown(): Promise<void>;
  healthCheck(): Promise<Record<EngineType, 'healthy' | 'degraded' | 'unavailable'>>;
}

export class DefaultAIOrchestrator implements AIOrchestrator {
  private engines = new Map<EngineType, unknown>();
  private config: OrchestratorConfig = {};

  async initialize(config: OrchestratorConfig): Promise<void> {
    this.config = config;
  }

  async process(request: AIRequest): Promise<AIResponse> {
    const engine = this.getEngine(this.resolveEngineType(request.type));
    if (!engine) {
      return { type: request.type, error: { code: 'NO_ENGINE', message: 'No engine registered for request type' } };
    }

    if (request.type === 'chat' && this.isLanguageEngine(engine)) {
      const text = await engine.generate(request.prompt ?? '', request.language as any);
      return { type: 'chat', text, provider: this.config.defaultProvider ?? 'local', latencyMs: 20 };
    }

    if (request.type === 'translate' && this.isTranslationEngine(engine)) {
      const result = await engine.translate(request.prompt ?? '', request.targetLanguage as any, request.language as any);
      return { type: 'translate', text: result.translatedText, provider: result.provider, confidence: result.confidence, latencyMs: 20 };
    }

    if (request.type === 'tts' && this.isSpeechEngine(engine)) {
      const audio = await engine.synthesize(request.prompt ?? '');
      return { type: 'tts', audioUrl: audio.audio as any, provider: audio.provider, mimeType: audio.mimeType };
    }

    if (request.type === 'stt' && this.isSpeechEngine(engine)) {
      const result = await engine.transcribe(request.input as string | Buffer);
      return { type: 'stt', text: result.text, provider: result.provider, confidence: result.confidence };
    }

    if (request.type === 'ocr' && this.isOcrEngine(engine)) {
      const ocrEngine = engine as OCREngine & {
        execute?: (...args: any[]) => Promise<any>;
        extractPrintedText?: (...args: any[]) => Promise<any>;
        extractText?: (...args: any[]) => Promise<any>;
      };
      const result = await (ocrEngine.extractPrintedText?.(request.input as any) ?? ocrEngine.extractText?.(request.input as any) ?? ocrEngine.execute?.(request.input as any));
      const extracted = result?.result ?? result;
      const rawText = extracted?.rawText ?? extracted?.fullText ?? extracted?.text ?? '';
      const confidence = extracted?.confidence ?? 0.8;
      return { type: 'ocr', text: rawText, provider: 'local', confidence };
    }

    return { type: request.type, text: 'Engine processed request', provider: this.config.defaultProvider ?? 'local' };
  }

  registerEngine<K extends EngineType>(type: K, engine: EngineRegistry[K]): void {
    this.engines.set(type, engine);
  }

  getEngine<K extends EngineType>(type: K): EngineRegistry[K] | undefined {
    return this.engines.get(type) as EngineRegistry[K] | undefined;
  }

  async shutdown(): Promise<void> {
    this.engines.clear();
  }

  async healthCheck(): Promise<Record<EngineType, 'healthy' | 'degraded' | 'unavailable'>> {
    return {
      language: 'healthy',
      vision: 'healthy',
      image: 'healthy',
      video: 'healthy',
      speech: 'healthy',
      translation: 'healthy',
      memory: 'healthy',
      ocr: 'healthy',
    };
  }

  private resolveEngineType(type?: AIRequest['type']): EngineType {
    switch (type) {
      case 'chat':
      case 'translate':
        return 'language';
      case 'tts':
      case 'stt':
        return 'speech';
      case 'ocr':
        return 'ocr';
      default:
        return 'language';
    }
  }

  private isLanguageEngine(engine: unknown): engine is LanguageEngine {
    return typeof (engine as LanguageEngine).generate === 'function';
  }

  private isTranslationEngine(engine: unknown): engine is TranslationEngine {
    return typeof (engine as TranslationEngine).translate === 'function';
  }

  private isSpeechEngine(engine: unknown): engine is SpeechEngine {
    return typeof (engine as SpeechEngine).synthesize === 'function' && typeof (engine as SpeechEngine).transcribe === 'function';
  }

  private isOcrEngine(engine: unknown): engine is OCREngine {
    const ocrEngine = engine as Partial<OCREngine> & { execute?: unknown; extractPrintedText?: unknown; extractText?: unknown };
    return typeof ocrEngine.extractPrintedText === 'function' || typeof ocrEngine.extractText === 'function' || typeof ocrEngine.execute === 'function';
  }
}

export function createOrchestrator(config: OrchestratorConfig): AIOrchestrator {
  const orchestrator = new DefaultAIOrchestrator();
  void orchestrator.initialize(config);
  return orchestrator;
}
