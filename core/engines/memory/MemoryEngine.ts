/**
 * MemoryEngine.ts
 *
 * Manages conversation context and long-term semantic memory for the 9JA AI platform.
 */

import type { EngineOptions } from '../../utils/types';

export type MemoryRole = 'user' | 'assistant' | 'system';

export interface ConversationTurn {
  id: string;
  role: MemoryRole;
  content: string;
  language?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MemoryContext {
  sessionId: string;
  userId?: string;
  turns: ConversationTurn[];
  summary?: string;
  totalTokens?: number;
}

export interface LongTermMemoryEntry {
  id: string;
  userId: string;
  content: string;
  embedding?: number[];
  tags?: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface MemoryEngine {
  startSession(sessionId: string, userId?: string): Promise<MemoryContext>;
  addTurn(sessionId: string, role: MemoryRole, content: string, metadata?: Record<string, unknown>): Promise<ConversationTurn>;
  getContext(sessionId: string, maxTokens?: number): Promise<MemoryContext>;
  clearSession(sessionId: string): Promise<void>;
  rememberFact(userId: string, content: string, tags?: string[]): Promise<LongTermMemoryEntry>;
  recall(userId: string, query: string, topK?: number, options?: EngineOptions): Promise<LongTermMemoryEntry[]>;
  forgetFact(userId: string, memoryId: string): Promise<void>;
}

export class DefaultMemoryEngine implements MemoryEngine {
  private readonly sessions = new Map<string, MemoryContext>();
  private readonly longTerm = new Map<string, LongTermMemoryEntry[]>();

  async startSession(sessionId: string, userId?: string): Promise<MemoryContext> {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const created: MemoryContext = { sessionId, userId, turns: [], totalTokens: 0 };
    this.sessions.set(sessionId, created);
    return created;
  }

  async addTurn(sessionId: string, role: MemoryRole, content: string, metadata?: Record<string, unknown>): Promise<ConversationTurn> {
    const session = await this.startSession(sessionId);
    const turn: ConversationTurn = { id: `${sessionId}-${session.turns.length + 1}`, role, content: content.trim(), timestamp: new Date(), metadata };
    session.turns.push(turn);
    session.totalTokens = (session.totalTokens ?? 0) + Math.max(8, Math.ceil(content.length / 4));
    if (session.turns.length > 8) {
      session.summary = `Recent conversation includes ${session.turns.slice(-4).map((entry) => entry.content).join(' | ')}`;
    }
    return turn;
  }

  async getContext(sessionId: string, maxTokens = 4000): Promise<MemoryContext> {
    const session = await this.startSession(sessionId);
    const trimmed = session.turns.slice(-8);
    const totalChars = trimmed.reduce((sum, turn) => sum + turn.content.length, 0);
    return { ...session, turns: totalChars > maxTokens ? trimmed : trimmed, totalTokens: totalChars };
  }

  async clearSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async rememberFact(userId: string, content: string, tags?: string[]): Promise<LongTermMemoryEntry> {
    const list = this.longTerm.get(userId) ?? [];
    const entry: LongTermMemoryEntry = {
      id: `fact-${userId}-${list.length + 1}`,
      userId,
      content: content.trim(),
      tags,
      createdAt: new Date(),
    };
    list.push(entry);
    this.longTerm.set(userId, list);
    return entry;
  }

  async recall(userId: string, query: string): Promise<LongTermMemoryEntry[]> {
    const entries = this.longTerm.get(userId) ?? [];
    const normalized = query.toLowerCase();
    return entries.filter((entry) => entry.content.toLowerCase().includes(normalized)).slice(0, 5);
  }

  async forgetFact(userId: string, memoryId: string): Promise<void> {
    const list = this.longTerm.get(userId) ?? [];
    this.longTerm.set(userId, list.filter((entry) => entry.id !== memoryId));
  }
}
