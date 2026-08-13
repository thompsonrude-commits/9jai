import { describe, it, expect } from 'vitest';
import VideoEngine from '../VideoEngine';

describe('VideoEngine (basic smoke)', () => {
  it('can run generate/edit/analyze pipeline stubs', async () => {
    const engine = new VideoEngine();
    const gen = await engine.generate({ id: 'v1', prompt: 'A short cinematic sequence' });
    expect(gen).toHaveProperty('id', 'v1');
    const edit = await engine.edit({ id: 'v2', source: null, instructions: 'Make it night' });
    expect(edit).toHaveProperty('id', 'v2');
    const analysis = await engine.analyze({ id: 'v3', source: null });
    expect(analysis).toHaveProperty('id', 'v3');
  });
});
