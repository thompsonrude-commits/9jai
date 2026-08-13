/**
 * KnowledgeEngine.ts
 *
 * Phase 15 refinement: a dedicated knowledge layer for retrieval,
 * document indexing, semantic search, and multi-document reasoning.
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  content: string;
  tags?: string[];
}

export interface KnowledgeQuery {
  query: string;
  language?: string;
  includeWeb?: boolean;
  maxResults?: number;
}

export interface KnowledgeEngine {
  index(document: KnowledgeDocument): Promise<void>;
  query(query: KnowledgeQuery): Promise<KnowledgeDocument[]>;
  clear(): Promise<void>;
}

export class DefaultKnowledgeEngine implements KnowledgeEngine {
  private readonly documents: KnowledgeDocument[] = [];

  async index(document: KnowledgeDocument): Promise<void> {
    this.documents.push(document);
  }

  async query(query: KnowledgeQuery): Promise<KnowledgeDocument[]> {
    const normalized = query.query.toLowerCase();
    return this.documents.filter((document) => document.content.toLowerCase().includes(normalized)).slice(0, query.maxResults ?? 5);
  }

  async clear(): Promise<void> {
    this.documents.splice(0, this.documents.length);
  }
}
