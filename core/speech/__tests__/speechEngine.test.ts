import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultCapabilityRegistry } from '../../capabilities/CapabilityRegistry';
import AIOrchestrator from '../../orchestrator/index';
import SpeechEngine from '../SpeechEngine';

describe('Speech Engine basic', () => {
  let registry: any;
  let orchestrator: any;
  let engine: SpeechEngine;

  beforeEach(() => {
    registry = new DefaultCapabilityRegistry();
    orchestrator = new AIOrchestrator();
    engine = new SpeechEngine({ id: 'test.speech' }, registry, orchestrator as any);
  });

  it('registers STT and TTS capabilities', () => {
    const stt = registry.get('speech.stt');
    const tts = registry.get('speech.tts');
    expect(stt).toBeDefined();
    expect(tts).toBeDefined();
  });

  it('performs placeholder STT', async () => {
    const adapter = orchestrator.adapters.get('speech.stt');
    expect(adapter).toBeDefined();
    const res = await adapter.execute({ input: { id: 's1', inputType: 'audio', data: 'Hello from test audio' } });
    expect(res.success).toBe(true);
    expect(res.result.transcript).toContain('Hello');
  });

  it('performs placeholder TTS', async () => {
    const adapter = orchestrator.adapters.get('speech.tts');
    expect(adapter).toBeDefined();
    const res = await adapter.execute({ input: { id: 't1', inputType: 'text', text: 'Hello world' } });
    expect(res.success).toBe(true);
    expect(res.result.audio).toMatch(/^audio-bytes:/);
  });
});
