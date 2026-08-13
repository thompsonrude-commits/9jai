import { MemoryEngineAPI, MemoryRecord } from './types';
import { defaultSessionMemory } from './sessionMemory';
import { defaultLongTermMemory } from './longTermMemory';
import { defaultRetrievalManager } from './retrievalManager';
import { defaultConsolidation } from './consolidation';
import { defaultForgetting } from './forgettingManager';
import { defaultPrivacyLayer } from './privacyLayer';

export class MemoryEngine implements MemoryEngineAPI {
  async saveMemory(record: Omit<MemoryRecord, 'id' | 'createdAt'>) {
    // two paths: session memory if sessionId present else long-term
    if (record.sessionId) {
      const rec = await defaultSessionMemory.saveSessionMemory(record.sessionId, record.userId, record.text, { tags: record.tags, importance: record.importance });
      await defaultRetrievalManager.indexRecord(rec);
      return rec;
    }
    const full = await defaultLongTermMemory.saveMemory(record.userId, record as any);
    await defaultRetrievalManager.indexRecord(full as any);
    return full as MemoryRecord;
  }

  async retrieveMemoryById(id: string, userId: string) {
    const s = await defaultSessionMemory.getSessionMemory(userId as any, 200).catch(() => []);
    const found = s.find(r => r.id === id);
    if (found) return found;
    return defaultLongTermMemory.getById(userId, id);
  }

  async searchMemories(query: string, userId: string, limit = 5) {
    // privacy enforced in retrieval manager or prior
    return defaultRetrievalManager.search(query, userId, limit);
  }

  async listMemories(userId: string) {
    return defaultLongTermMemory.listMemories(userId);
  }

  async deleteMemory(id: string, userId: string) {
    const ok = await defaultForgetting.deleteMemory(userId, id);
    return ok;
  }
}

export const defaultMemoryEngine = new MemoryEngine();
