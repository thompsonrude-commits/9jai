import type { Document, IndexRecord } from './types';
import { simpleEmbed } from './semantic';

export class DocumentIndexer {
  // naive chunking by paragraph
  async indexDocument(doc: Document): Promise<IndexRecord[]> {
    const chunks = this.chunkText(doc.text);
    const records: IndexRecord[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${doc.id}:chunk:${i}`;
      const vector = await simpleEmbed(chunks[i]);
      const rec: IndexRecord = { id: `${doc.id}-${i}`, docId: doc.id, chunkId, text: chunks[i], vector, metadata: { title: doc.title } };
      records.push(rec);
    }
    return records;
  }

  chunkText(text: string): string[] {
    const parts = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0 && text.trim()) return [text.trim()];
    return parts;
  }
}
