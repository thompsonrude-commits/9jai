import { MemoryRecord } from './types';

export class LongTermMemoryManager {
  private store: Map<string, MemoryRecord[]> = new Map();

  async saveMemory(userId: string, rec: Omit<MemoryRecord, 'id' | 'createdAt'>) {
    const full: MemoryRecord = { ...rec, id: `lt_${Date.now()}_${Math.floor(Math.random()*1e6)}`, createdAt: Date.now() } as MemoryRecord;
    const arr = this.store.get(userId) || [];
    arr.push(full);
    this.store.set(userId, arr);
    return full;
  }

  async listMemories(userId: string) {
    return this.store.get(userId) || [];
  }

  async getById(userId: string, id: string) {
    const arr = this.store.get(userId) || [];
    return arr.find(r => r.id === id) || null;
  }

  async delete(userId: string, id: string) {
    const arr = this.store.get(userId) || [];
    const n = arr.filter(r => r.id !== id);
    this.store.set(userId, n);
    return true;
  }
}

export const defaultLongTermMemory = new LongTermMemoryManager();
