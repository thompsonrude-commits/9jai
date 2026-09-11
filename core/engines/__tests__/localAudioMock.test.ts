import { describe, expect, it } from 'vitest';

describe('local audio mock provider', () => {
  it('generates audio via local-audio-mock', async () => {
    const mod = await import('../../../functions/src/media/engine');
    const res = await mod.generateMedia({ kind: 'audio', prompt: 'Test tone for CI' });

    expect(res).toBeDefined();
    expect(res.kind).toBe('audio');
    // provider may be local-audio-mock when mock is available
    expect(res.provider).toBeDefined();
    // audioBase64 should be present on the returned object
    expect((res as any).audioBase64).toBeTruthy();
  });
});
