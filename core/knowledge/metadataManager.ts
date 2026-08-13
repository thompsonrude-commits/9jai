import type { Document } from './types';

export class MetadataManager {
  extract(doc: Document) {
    return {
      title: doc.title ?? doc.metadata?.title ?? null,
      author: doc.author ?? doc.metadata?.author ?? null,
      date: doc.date ?? null,
      language: doc.language ?? null,
      source: doc.source ?? null,
    };
  }
}
