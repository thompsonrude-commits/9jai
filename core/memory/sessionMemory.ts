import { MemoryRecord } from './types';

const makeId = () => `m_${Date.now().toString(36)}_${Math.floor(Math.random()*1e6).toString(36)}`;

export class SessionMemoryManager {
  private sessions: Map<string, MemoryRecord[]> = new Map();

  async saveSessionMemory(sessionId: string, userId: string, text: string, opts?: { tags?: string[]; importance?: number; expiresInSeconds?: number }) {
    const rec: MemoryRecord = {
      id: makeId(),
      userId,
      sessionId,
      text,
      tags: opts?.tags || [],
      importance: opts?.importance ?? 0.5,
      createdAt: Date.now(),
      expiresAt: opts?.expiresInSeconds ? Date.now() + opts.expiresInSeconds * 1000 : undefined,
    };
    const arr = this.sessions.get(sessionId) || [];
    arr.push(rec);
    this.sessions.set(sessionId, arr);
    return rec;
  }

  async getSessionMemory(sessionId: string, limit = 50) {
    const arr = this.sessions.get(sessionId) || [];
    return arr.slice(-limit).reverse();
  }

  async clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
    return true;
  }
}

export const defaultSessionMemory = new SessionMemoryManager();
