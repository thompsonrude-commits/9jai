import { nlieEvents } from './events';
import type { NlieEngineOptions, NlieRequest, NlieResult, LanguageDetectionResult } from './types';
import type { CapabilityRegistry, CapabilityDescriptor } from '../capabilities/CapabilityRegistry';
import type { AIOrchestrator } from '../orchestrator/index';
import type { ModelRuntime } from '../runtime/ModelRuntime';

export class NlieEngine {
  readonly id: string;
  readonly name: string;

  constructor(private readonly options: NlieEngineOptions = {}, private readonly registry?: CapabilityRegistry, private readonly orchestrator?: AIOrchestrator, private readonly runtime?: ModelRuntime) {
    this.id = options.id ?? 'core.nlie.engine';
    this.name = options.name ?? 'Nigerian Language Intelligence Engine';
    if (this.registry) this.registerCapability();
    if (this.orchestrator) this.registerAdapter();
  }

  registerCapability() {
    const desc: CapabilityDescriptor = {
      capabilityId: 'nlie.language',
      name: 'Nigerian Language Intelligence',
      description: 'Detects, interprets, and translates Nigerian languages, pidgin, dialects, and cultural expressions',
      category: 'language',
      inputTypes: ['text/plain'],
      outputTypes: ['application/json', 'text/plain'],
      supportedLanguages: [],
      streaming: true,
      priority: 40,
      confidenceSupport: true,
      version: '0.1.0',
      pluginId: 'core.nlie',
    };
    this.registry?.register(desc);
  }

  registerAdapter() {
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'nlie.language', execute: (req) => this.execute(req.input) });
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    // lightweight heuristic-based detection placeholder
    const lower = text.toLowerCase();
    if (/\b(abeg|no wahala|wetin|ehen|na so|i dey)\b/.test(lower)) {
      return { language: 'pcm', confidence: 0.92, isCodeSwitched: false } as LanguageDetectionResult;
    }
    // fallback to english
    return { language: 'en', confidence: 0.6, isCodeSwitched: false } as LanguageDetectionResult;
  }

  async translate(text: string, target: string): Promise<{ translated: string; confidence: number }> {
    // placeholder: echo
    return { translated: text, confidence: 0.6 };
  }

  async execute(input: any): Promise<any> {
    const req: NlieRequest = input as NlieRequest;
    const requestId = req.id ?? `nlie-${Date.now()}`;
    nlieEvents.emitEvent({ type: 'NlieRequested', requestId });

    try {
      const start = Date.now();
      const text = req.text ?? '';
      const detection = await this.detectLanguage(text);
      const translations = [];
      if (detection.language !== 'en') {
        const t = await this.translate(text, 'en');
        translations.push({ sourceLanguage: detection.language, targetLanguage: 'en', translatedText: t.translated, confidence: t.confidence });
      }

      const result: NlieResult = {
        id: requestId,
        detection: detection as any,
        translations,
        interpretation: `Interpreted as ${detection.language}`,
        confidence: detection.confidence,
        metadata: { processingTimeMs: Date.now() - start, engine: this.id },
      };

      nlieEvents.emitEvent({ type: 'NlieCompleted', requestId, result });
      return { success: true, result };
    } catch (err: any) {
      nlieEvents.emitEvent({ type: 'NlieFailed', requestId, reason: String(err) });
      return { success: false, error: String(err) };
    }
  }
}

export default NlieEngine;
