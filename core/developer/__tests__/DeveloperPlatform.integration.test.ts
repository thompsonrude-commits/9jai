import { describe, it, expect } from 'vitest';
import { DeveloperPlatform } from '../DeveloperPlatform';

describe('DeveloperPlatform integration', () => {
  it('registers capabilities and evaluation suites when scaffolding a plugin', async () => {
    const registeredCaps: any[] = [];
    const registeredSuites: any[] = [];

    const fakeRegistry = {
      register: (cap: any) => registeredCaps.push(cap),
      list: () => registeredCaps.slice(),
    } as any;

    const fakeEvaluation = {
      registerSuite: (s: any) => registeredSuites.push(s),
    } as any;

    const platform = new DeveloperPlatform({ capabilityRegistry: fakeRegistry, evaluationEngine: fakeEvaluation } as any);

    const cap = { capabilityId: 'test.cap', name: 'Test Cap', description: 'desc', category: 'utility', inputTypes: ['text/plain'], outputTypes: ['text/plain'], version: '0.1.0', pluginId: 'p1' };

    const res = await platform.scaffoldPlugin({ pluginId: 'p1', name: 'P1', description: 'd', capabilities: [cap as any] });
    expect(res.success).toBe(true);
    expect(registeredCaps.length).toBeGreaterThan(0);
    expect(registeredCaps[0].capabilityId).toBe('test.cap');
    expect(registeredSuites.length).toBeGreaterThan(0);
    expect(String(registeredSuites[0].suiteId)).toContain('bench.plugin.p1');
  });
});
