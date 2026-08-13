export interface MemoryEngine {
  storeConversation(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  storeUserContext(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  storeImageContext(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  storeDocumentContext(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  retrieveLongTermContext(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface MemoryRecord {
  id: string;
  scope: 'conversation' | 'preferences' | 'image' | 'document' | 'project' | 'session';
  content: Record<string, unknown>;
  private?: boolean;
  createdAt: string;
  userId?: string;
  sessionId?: string;
}

export interface MemoryStoreRequest {
  scope: MemoryRecord['scope'];
  content: Record<string, unknown>;
  private?: boolean;
  userId?: string;
  sessionId?: string;
}

export interface MemoryStoreAdapter {
  save(record: MemoryRecord): Promise<MemoryRecord>;
  list(filter: Record<string, unknown>): Promise<MemoryRecord[]>;
}

export interface MemoryEngineDependencies {
  store?: MemoryStoreAdapter;
}

export class MemoryEngineAdapter implements MemoryEngine {
  private readonly store: MemoryStoreAdapter;

  constructor(dependencies: MemoryEngineDependencies = {}) {
    this.store = dependencies.store ?? new InMemoryStore();
  }

  public async storeConversation(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.storeRecord('conversation', request);
  }

  public async storeUserContext(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.storeRecord('preferences', request);
  }

  public async storeImageContext(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.storeRecord('image', request);
  }

  public async storeDocumentContext(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.storeRecord('document', request);
  }

  public async retrieveLongTermContext(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const scope = this.normalizeScope(request.scope);
    const filter: Record<string, unknown> = { scope };

    if (request.userId) {
      filter.userId = request.userId;
    }

    if (request.sessionId) {
      filter.sessionId = request.sessionId;
    }

    const records = await this.store.list(filter);
    return {
      records,
      scope,
      metadata: {
        count: records.length,
        privacyMode: records.some((record) => record.private),
      },
    };
  }

  private async storeRecord(scope: MemoryRecord['scope'], request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const record = await this.store.save({
      id: `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      scope,
      content: this.normalizeContent(request.content ?? request),
      private: request.private === true,
      createdAt: new Date().toISOString(),
      userId: typeof request.userId === 'string' ? request.userId : undefined,
      sessionId: typeof request.sessionId === 'string' ? request.sessionId : undefined,
    });

    return {
      record,
      scope,
      metadata: {
        stored: true,
        private: record.private === true,
      },
    };
  }

  private normalizeContent(content: unknown): Record<string, unknown> {
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      return content as Record<string, unknown>;
    }

    return {};
  }

  private normalizeScope(value: unknown): MemoryRecord['scope'] {
    if (value === 'conversation' || value === 'preferences' || value === 'image' || value === 'document' || value === 'project' || value === 'session') {
      return value;
    }

    return 'conversation';
  }
}

class InMemoryStore implements MemoryStoreAdapter {
  private readonly records: MemoryRecord[] = [];

  public async save(record: MemoryRecord): Promise<MemoryRecord> {
    this.records.push(record);
    return record;
  }

  public async list(filter: Record<string, unknown>): Promise<MemoryRecord[]> {
    return this.records.filter((record) => {
      return Object.entries(filter).every(([key, value]) => record[key as keyof MemoryRecord] === value);
    });
  }
}
