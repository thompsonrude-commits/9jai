import { describe, it, expect } from 'vitest';
import { DefaultMemoryEngine } from '../MemoryEngine';

describe('DefaultMemoryEngine', () => {
  it('stores and retrieves session memory', async () => {
    const engine = new DefaultMemoryEngine();
    const stored = await engine.addTurn('session-1', 'user', 'I like Edo language learning', { source: 'test' });
    const context = await engine.getContext('session-1');

    expect(stored.content).toContain('Edo');
    expect(context.turns.some((turn) => turn.content.includes('Edo'))).toBe(true);
  });

  it('persists long-term facts for a user', async () => {
    const engine = new DefaultMemoryEngine();
    const fact = await engine.rememberFact('user-1', 'Prefers Yoruba translations', ['language']);

    expect(fact.userId).toBe('user-1');
    expect(fact.content).toContain('Yoruba');
  });
});
