export interface MemoryRecord {
  id: string;
  userId: string;
  sessionId?: string;
  text: string;
  tags?: string[];
  embedding?: number[];
  importance?: number; // 0-1
  createdAt: number;
  updatedAt?: number;
  expiresAt?: number;
}

export interface MemoryQueryResult {
  record: MemoryRecord;
  score: number;
}

export interface MemoryEngineAPI {
  saveMemory(record: Omit<MemoryRecord, 'id' | 'createdAt'>): Promise<MemoryRecord>;
  retrieveMemoryById(id: string, userId: string): Promise<MemoryRecord | null>;
  searchMemories(query: string, userId: string, limit?: number): Promise<MemoryQueryResult[]>;
  listMemories(userId: string): Promise<MemoryRecord[]>;
  deleteMemory(id: string, userId: string): Promise<boolean>;
}
