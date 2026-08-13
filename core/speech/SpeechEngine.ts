import type { SpeechEngineOptions, SttRequest, TtsRequest, SttResult, TtsResult } from './types';
import { speechEvents } from './events';
import type { CapabilityRegistry, CapabilityDescriptor } from '../capabilities/CapabilityRegistry';
import type { AIOrchestrator } from '../orchestrator/index';
import type { ModelRuntime } from '../runtime/ModelRuntime';

export class SpeechEngine {
  readonly id: string;
  readonly name: string;

  constructor(private readonly options: SpeechEngineOptions = {}, private readonly registry?: CapabilityRegistry, private readonly orchestrator?: AIOrchestrator, private readonly runtime?: ModelRuntime) {
    this.id = options.id ?? 'core.speech.engine';
    this.name = options.name ?? 'Speech Intelligence Engine';
    if (this.registry) this.registerCapabilities();
    if (this.orchestrator) this.registerAdapters();
  }

  registerCapabilities() {
    const stt: CapabilityDescriptor = {
      capabilityId: 'speech.stt',
      name: 'Speech-to-Text',
      description: 'Streaming and batch speech recognition',
      category: 'speech',
      inputTypes: ['audio/*'],
      outputTypes: ['text/plain', 'application/json'],
      streaming: true,
      priority: 40,
      confidenceSupport: true,
      version: '0.1.0',
      pluginId: 'core.speech',
    };

    const tts: CapabilityDescriptor = {
      capabilityId: 'speech.tts',
      name: 'Text-to-Speech',
      description: 'High-quality speech synthesis with multiple voices',
      category: 'speech',
      inputTypes: ['text/plain'],
      outputTypes: ['audio/*'],
      streaming: true,
      priority: 40,
      confidenceSupport: false,
      version: '0.1.0',
      pluginId: 'core.speech',
    };

    this.registry?.register(stt);
    this.registry?.register(tts);
  }

  registerAdapters() {
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'speech.stt', execute: (req) => this.recognize(req.input) });
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'speech.tts', execute: (req) => this.synthesize(req.input) });
  }

  async recognize(input: any): Promise<any> {
    const req: SttRequest = input as SttRequest;
    const requestId = req.id ?? `stt-${Date.now()}`;
    speechEvents.emitEvent({ type: 'SpeechRequested', requestId });
    try {
      // placeholder recognizer: if data is string, return it as transcript
      const raw = typeof req.data === 'string' ? req.data : 'recognized speech';
      const result: SttResult = { id: requestId, transcript: raw, language: 'en', confidence: 0.85, segments: [{ start: 0, end: raw.length / 10, text: raw, confidence: 0.85 }], metadata: { engine: this.id } };
      speechEvents.emitEvent({ type: 'SttCompleted', requestId, result });
      return { success: true, result };
    } catch (err: any) {
      speechEvents.emitEvent({ type: 'SpeechFailed', requestId, reason: String(err) });
      return { success: false, error: String(err) };
    }
  }

  async synthesize(input: any): Promise<any> {
    const req: TtsRequest = input as TtsRequest;
    const requestId = req.id ?? `tts-${Date.now()}`;
    speechEvents.emitEvent({ type: 'SpeechRequested', requestId });
    try {
      // placeholder synthesizer: return a fake audio token
      const audio = `audio-bytes:${Buffer.from(req.text ?? '').toString('base64')}`;
      const result: TtsResult = { id: requestId, audio, mimeType: 'audio/basic', metadata: { engine: this.id } };
      speechEvents.emitEvent({ type: 'TtsCompleted', requestId, result });
      return { success: true, result };
    } catch (err: any) {
      speechEvents.emitEvent({ type: 'SpeechFailed', requestId, reason: String(err) });
      return { success: false, error: String(err) };
    }
  }
}

export default SpeechEngine;
