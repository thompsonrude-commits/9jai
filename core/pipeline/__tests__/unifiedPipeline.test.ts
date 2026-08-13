import { describe, it, expect } from 'vitest';
import { AIOrchestrator } from '../../orchestrator/index';
import { DefaultCapabilityRegistry } from '../../capabilities/CapabilityRegistry';
import UnifiedPipeline from '../UnifiedPipeline';

describe('UnifiedPipeline (basic integration)', () => {
  it('plans and executes a simple ocr pipeline via orchestrator scheduler and adapter', async () => {
    const orchestrator = new AIOrchestrator();
    orchestrator.scheduler.start();
    // register capability that the resolver will find
    orchestrator.registry.register({ capabilityId: 'ocr', name: 'ocr', description: 'test', category: 'ocr', inputTypes: ['image/*'], outputTypes: ['application/json'], version: '0.1.0', pluginId: 'test', priority: 50 });

    // register a simple adapter for 'ocr' capability
    orchestrator.registerAdapter({ engineId: 'test.engine', capability: 'ocr', execute: async (req) => ({ success: true, text: 'detected' }) });

    const pipeline = new UnifiedPipeline({ orchestrator });
    const res = await pipeline.run({ id: 'u1', input: 'please ocr this' });
    orchestrator.scheduler.stop();
    expect(res).toHaveProperty('id', 'u1');
    expect(res.results).toBeInstanceOf(Array);
    expect(res.results[0]).toHaveProperty('capability', 'ocr');
    expect(res.results[0]).toHaveProperty('success', true);
  });
});
