import { EventEmitter } from 'events';
import type { Document, IndexRecord } from './types';
import { KnowledgeStoreError, DocumentNotFound, DuplicateDocument, InvalidDocument } from './errors';

// Pagination and listing helpers
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string | null; // placeholder for future cursor support
}

export interface ListResult<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
  nextCursor?: string | null;
}

export interface Transaction {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface KnowledgeHealth {
  status: 'ok' | 'degraded' | 'unavailable';
  storageType: string;
  documentCount: number;
  indexCount: number;
  lastError?: string | null;
  lastCheckedAt: number;
}

export interface KnowledgeStore {
  // Document management
  saveDocument(doc: Document): Promise<void>;
  getDocument(id: string): Promise<Document>;
  updateDocument(id: string, patch: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  documentExists(id: string): Promise<boolean>;
  listDocuments(opts?: PaginationOptions): Promise<ListResult<Document>>;

  // Index management
  saveIndex(record: IndexRecord): Promise<void>;
  getIndex(id: string): Promise<IndexRecord>;
  updateIndex(id: string, patch: Partial<IndexRecord>): Promise<IndexRecord>;
  deleteIndex(id: string): Promise<void>;
  listIndexes(opts?: PaginationOptions): Promise<ListResult<IndexRecord>>;

  // Stats
  countDocuments(): Promise<number>;
  countIndexes(): Promise<number>;

  // Transactions (may be no-op for some backends)
  beginTransaction(): Promise<Transaction>;

  // Health & lifecycle
  health(): Promise<KnowledgeHealth>;
  close(): Promise<void>;
}

// Event bus for observability
export const knowledgeEvents = new EventEmitter();

// Simple in-memory implementation kept as default and for testing
export class InMemoryKnowledgeStore implements KnowledgeStore {
  private docs = new Map<string, Document>();
  private idx = new Map<string, IndexRecord>();

  constructor(private readonly storageName = 'in-memory') {}

  private validateDocument(doc: Document) {
    if (!doc || typeof doc !== 'object') throw new KnowledgeStoreError('Invalid document payload');
    if (!doc.id || typeof doc.id !== 'string') throw new InvalidDocument('Document id is required and must be a string');
    if (!doc.text || typeof doc.text !== 'string') throw new InvalidDocument('Document text is required');
  }

  async saveDocument(doc: Document): Promise<void> {
    this.validateDocument(doc);
    if (this.docs.has(doc.id)) throw new DuplicateDocument(`Document with id ${doc.id} already exists`);
    this.docs.set(doc.id, { ...doc });
    knowledgeEvents.emit('DocumentSaved', { id: doc.id });
  }

  async getDocument(id: string): Promise<Document> {
    const d = this.docs.get(id);
    if (!d) throw new DocumentNotFound(`Document ${id} not found`);
    return { ...d };
  }

  async updateDocument(id: string, patch: Partial<Document>): Promise<Document> {
    const existing = this.docs.get(id);
    if (!existing) throw new DocumentNotFound(`Document ${id} not found`);
    const updated = { ...existing, ...patch };
    this.validateDocument(updated as Document);
    this.docs.set(id, updated as Document);
    knowledgeEvents.emit('DocumentUpdated', { id });
    return { ...updated } as Document;
  }

  async deleteDocument(id: string): Promise<void> {
    const existed = this.docs.delete(id);
    if (!existed) throw new DocumentNotFound(`Document ${id} not found`);
    // remove related indexes
    for (const [k, v] of this.idx.entries()) {
      if (v.docId === id) this.idx.delete(k);
    }
    knowledgeEvents.emit('DocumentDeleted', { id });
  }

  async documentExists(id: string): Promise<boolean> {
    return this.docs.has(id);
  }

  async listDocuments(opts?: PaginationOptions): Promise<ListResult<Document>> {
    const all = Array.from(this.docs.values());
    const total = all.length;
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 50;
    const items = all.slice(offset, offset + limit).map((d) => ({ ...d }));
    // nextCursor is not implemented for in-memory
    return { items, total, limit, offset, nextCursor: null };
  }

  async saveIndex(record: IndexRecord): Promise<void> {
    if (!record || !record.id) throw new KnowledgeStoreError('Invalid index record');
    if (this.idx.has(record.id)) throw new DuplicateDocument(`Index ${record.id} already exists`);
    this.idx.set(record.id, { ...record });
    knowledgeEvents.emit('IndexCreated', { id: record.id, docId: record.docId });
  }

  async getIndex(id: string): Promise<IndexRecord> {
    const r = this.idx.get(id);
    if (!r) throw new KnowledgeStoreError(`Index ${id} not found`);
    return { ...r };
  }

  async updateIndex(id: string, patch: Partial<IndexRecord>): Promise<IndexRecord> {
    const existing = this.idx.get(id);
    if (!existing) throw new KnowledgeStoreError(`Index ${id} not found`);
    const updated = { ...existing, ...patch };
    this.idx.set(id, updated);
    knowledgeEvents.emit('IndexUpdated', { id });
    return { ...updated };
  }

  async deleteIndex(id: string): Promise<void> {
    const ok = this.idx.delete(id);
    if (!ok) throw new KnowledgeStoreError(`Index ${id} not found`);
    knowledgeEvents.emit('IndexDeleted', { id });
  }

  async listIndexes(opts?: PaginationOptions): Promise<ListResult<IndexRecord>> {
    const all = Array.from(this.idx.values());
    const total = all.length;
    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 100;
    const items = all.slice(offset, offset + limit).map((r) => ({ ...r }));
    return { items, total, limit, offset, nextCursor: null };
  }

  async countDocuments(): Promise<number> {
    return this.docs.size;
  }

  async countIndexes(): Promise<number> {
    return this.idx.size;
  }

  async beginTransaction(): Promise<Transaction> {
    // in-memory store: provide a no-op transaction that resolves
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      commit: async () => {
        knowledgeEvents.emit('TransactionCommitted', { id: tx.id });
      },
      rollback: async () => {
        knowledgeEvents.emit('TransactionRolledBack', { id: tx.id });
      },
    };
    knowledgeEvents.emit('TransactionStarted', { id: tx.id });
    return tx;
  }

  async health(): Promise<KnowledgeHealth> {
    return {
      status: 'ok',
      storageType: this.storageName,
      documentCount: this.docs.size,
      indexCount: this.idx.size,
      lastError: null,
      lastCheckedAt: Date.now(),
    };
  }

  async close(): Promise<void> {
    // noop for memory
    knowledgeEvents.emit('StoreClosed', { storageType: this.storageName });
  }
}

export default InMemoryKnowledgeStore;