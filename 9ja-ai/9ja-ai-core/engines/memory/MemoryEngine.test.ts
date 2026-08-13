import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryEngineAdapter, MemoryStoreAdapter, MemoryRecord, MemoryStoreRequest } from './MemoryEngine.js';

class StubMemoryStore implements MemoryStoreAdapter {
  public readonly stored: MemoryRecord[] = [];

  public async save(record: MemoryRecord): Promise<MemoryRecord> {
    this.stored.push(record);
    return record;
  }

  public async list(filter: Record<string, unknown>): Promise<MemoryRecord[]> {
    return this.stored.filter((record) => record.scope === filter.scope);
  }
}

test('stores conversation memory and retrieves scoped context', async () => {
  const store = new StubMemoryStore();
  const engine = new MemoryEngineAdapter({ store });

  await engine.storeConversation({ sessionId: 'session-1', content: 'hello', userId: 'user-1' });
  const context = await engine.retrieveLongTermContext({ sessionId: 'session-1', scope: 'conversation' });

  assert.equal(context.records?.length, 1);
  assert.equal(context.records?.[0].scope, 'conversation');
});

test('stores user preferences privately and keeps them scoped', async () => {
  const store = new StubMemoryStore();
  const engine = new MemoryEngineAdapter({ store });

  await engine.storeUserContext({ userId: 'user-1', preferences: { language: 'en' }, private: true });
  const context = await engine.retrieveLongTermContext({ userId: 'user-1', scope: 'preferences' });

  assert.equal(context.records?.length, 1);
  assert.equal(context.records?.[0].private, true);
});
