import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultCapabilityRegistry } from '../../capabilities/CapabilityRegistry';
import AIOrchestrator from '../../orchestrator/index';
import NlieEngine from '../NlieEngine';

describe('NLIE basic', () => {
  let registry: any;
  let orchestrator: any;
  let engine: NlieEngine;

  beforeEach(() => {
    registry = new DefaultCapabilityRegistry();
    orchestrator = new AIOrchestrator();
    engine = new NlieEngine({ id: 'test.nlie' }, registry, orchestrator as any);
  });

  it('registers capability', () => {
    const cap = registry.get('nlie.language');
    expect(cap).toBeDefined();
    expect(cap?.capabilityId).toBe('nlie.language');
  });

  it('detects pidgin and returns translations placeholder', async () => {
    const adapter = orchestrator.adapters.get('nlie.language');
    expect(adapter).toBeDefined();
    const res = await adapter.execute({ input: { id: 'r1', inputType: 'text', text: 'Abeg make you help me' } });
    expect(res.success).toBe(true);
    expect(res.result.detection.language).toBe('pcm');
    expect(res.result.confidence).toBeGreaterThan(0.5);
  });
});
