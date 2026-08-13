import type { RetrievalResult } from './types';

export class ContextBuilder {
  build(results: RetrievalResult[], maxTokens = 2048) {
    // naive: join top results until limit
    const selected: RetrievalResult[] = [];
    let len = 0;
    for (const r of results) {
      const tlen = r.text.length;
      if (len + tlen > maxTokens) break;
      selected.push(r);
      len += tlen;
    }
    // dedupe by text
    const seen = new Set<string>();
    const dedup: RetrievalResult[] = [];
    for (const s of selected) {
      if (!seen.has(s.text)) {
        dedup.push(s);
        seen.add(s.text);
      }
    }
    return dedup;
  }
}
