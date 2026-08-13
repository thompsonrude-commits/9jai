import { describe, it, expect } from 'vitest';
import ImageEngine from '../ImageEngine';

describe('ImageEngine (basic smoke)', () => {
  it('registers and can handle generate/edit/analyze stubs', async () => {
    const engine = new ImageEngine();
    const gen = await engine.generate({ id: 'g1', prompt: 'A test image' });
    expect(gen).toHaveProperty('id', 'g1');
    const edit = await engine.edit({ id: 'e1', image: null, prompt: 'Make it blue' });
    expect(edit).toHaveProperty('id', 'e1');
    const analysis = await engine.analyze({ id: 'a1', image: null });
    expect(analysis).toHaveProperty('id', 'a1');
  });
});
