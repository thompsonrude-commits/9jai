import { MemoryRecord, MemoryQueryResult } from './types';
import { defaultSessionMemory } from './sessionMemory';
import { defaultLongTermMemory } from './longTermMemory';

function simpleEmbed(text: string, dim = 32) {
  const v = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    v[i % dim] = (v[i % dim] || 0) + (ch % 97);
  }
  // normalize
  const norm = Math.hypot(...v.map(x => x || 0)) || 1;
  return v.map(x => x / norm);
}

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += (a[i] || 0) * (b[i] || 0);
  return s;
}

export class RetrievalManager {
  async indexRecord(record: MemoryRecord) {
    if (!record.embedding) record.embedding = simpleEmbed(record.text);
    return record;
  }

  async search(query: string, userId: string, limit = 5): Promise<MemoryQueryResult[]> {
    const qv = simpleEmbed(query);
    const session = await defaultSessionMemory.getSessionMemory(userId as any, 100).catch(() => []);
    const long = await defaultLongTermMemory.listMemories(userId).catch(() => []);
    const pool = [...session, ...long];
    const scored = pool.map(r => ({ record: r, score: dot(r.embedding || simpleEmbed(r.text), qv) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => ({ record: s.record, score: s.score }));
  }
}

export const defaultRetrievalManager = new RetrievalManager();
