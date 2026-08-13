import type { OcrEngineOptions, OcrRequest, OcrResult } from './types';
import { ocrEvents } from './events';
import type { CapabilityRegistry, CapabilityDescriptor } from '../capabilities/CapabilityRegistry';
import type { AIOrchestrator } from '../orchestrator/index';
import type { ModelRuntime, RuntimeRequestContext } from '../runtime/ModelRuntime';
import type { ModelManager } from '../models/ModelManager';

export class OcrEngine {
  readonly id: string;
  readonly name: string;

  constructor(private readonly options: OcrEngineOptions = {}, private readonly registry?: CapabilityRegistry, private readonly orchestrator?: AIOrchestrator, private readonly runtime?: ModelRuntime, private readonly models?: ModelManager) {
    this.id = options.id ?? 'core.ocr.engine';
    this.name = options.name ?? 'Core OCR Engine';
    if (this.registry) this.registerCapability();
    if (this.orchestrator) this.registerAdapter();
  }

  registerCapability() {
    const desc: CapabilityDescriptor = {
      capabilityId: 'ocr.text',
      name: 'OCR Text Extraction',
      description: 'Extracts text and layout from images and documents',
      category: 'ocr',
      inputTypes: ['image/*', 'application/pdf'],
      outputTypes: ['text/plain', 'application/json'],
      supportedLanguages: [],
      streaming: true,
      priority: 50,
      confidenceSupport: true,
      version: '0.1.0',
      pluginId: 'core.ocr',
    };
    this.registry?.register(desc);
  }

  registerAdapter() {
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'ocr.text', execute: (req) => this.execute(req.input) });
  }

  async execute(input: any): Promise<any> {
    const req: OcrRequest = input as OcrRequest;
    const requestId = req.id ?? `ocr-${Date.now()}`;
    ocrEvents.emitEvent({ type: 'OcrRequested', requestId });

    try {
      // For now, use a simple placeholder pipeline to remain model-independent
      const start = Date.now();
      const pages = [];
      const raw = typeof req.data === 'string' ? req.data : 'extracted text';
      pages.push({ pageNumber: 1, blocks: [{ id: 'b1', type: 'paragraph', lines: [{ spans: [{ text: raw, confidence: 0.9, bbox: [0, 0, 0, 0] }], lineConfidence: 0.9 }], confidence: 0.9 }] });

      const result: OcrResult = {
        id: requestId,
        pages,
        rawText: raw,
        confidence: 0.9,
        metadata: { processingTimeMs: Date.now() - start, engine: this.id, model: 'none' },
      };

      ocrEvents.emitEvent({ type: 'OcrCompleted', requestId, result });
      return { success: true, result };
    } catch (err: any) {
      ocrEvents.emitEvent({ type: 'OcrFailed', requestId, reason: String(err) });
      return { success: false, error: String(err) };
    }
  }
}

export default OcrEngine;
