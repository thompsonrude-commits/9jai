import type { KnowledgeStore } from './knowledgeStore';
import { InMemoryKnowledgeStore } from './knowledgeStore';
import { SemanticIndex, simpleEmbed } from './semantic';
import type { RetrievalResult, IndexRecord, Document } from './types';

export class RetrievalManager {
  private store: KnowledgeStore;
  private sem = new SemanticIndex();

  constructor(store?: KnowledgeStore) {
    this.store = store ?? new InMemoryKnowledgeStore();
  }

  async indexDocument(doc: Document) {
    // save document
    await this.store.saveDocument(doc);
    // chunk and index
    // a small inline chunker for tests
    const chunks = (doc.text.match(/[^\n]{1,1000}(?:\n|$)/g) || []).map((s) => s.trim()).filter(Boolean);
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const vec = await simpleEmbed(chunkText);
      const rec: IndexRecord = { id: `${doc.id}:${i}`, docId: doc.id, chunkId: `${doc.id}:${i}`, text: chunkText, vector: vec, metadata: { title: doc.title } };
      await this.store.saveIndex(rec);
      this.sem.add(rec.id, vec, rec);
    }
  }

  async retrieve(query: string, topK = 5): Promise<RetrievalResult[]> {
    const qv = await simpleEmbed(query);
    const found = this.sem.search(qv, topK);
    return found.map((f) => ({ id: f.id, docId: f.rec.docId, score: f.score, text: f.rec.text, metadata: f.rec.metadata }));
  }
}
