import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultCapabilityRegistry } from '../../capabilities/CapabilityRegistry';
import AIOrchestrator from '../../orchestrator/index';
import OcrEngine from '../OcrEngine';

describe('OCR Engine basic', () => {
  let registry: any;
  let orchestrator: any;
  let engine: OcrEngine;

  beforeEach(() => {
    registry = new DefaultCapabilityRegistry();
    orchestrator = new AIOrchestrator();
    engine = new OcrEngine({ id: 'test.ocr' }, registry, orchestrator as any);
  });

  it('registers capability', () => {
    const cap = registry.get('ocr.text');
    expect(cap).toBeDefined();
    expect(cap?.capabilityId).toBe('ocr.text');
  });

  it('executes basic extraction via adapter', async () => {
    const adapter = orchestrator.adapters.get('ocr.text');
    expect(adapter).toBeDefined();
    const res = await adapter.execute({ input: { id: 'r1', inputType: 'image', data: 'Hello OCR' } });
    expect(res.success).toBe(true);
    expect(res.result.rawText).toContain('Hello OCR');
  });
});
