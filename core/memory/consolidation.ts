import { MemoryRecord } from './types';

export class ConsolidationManager {
  async summarize(records: MemoryRecord[], maxChars = 500) {
    const joined = records.map(r => r.text).join('\n');
    if (joined.length <= maxChars) return joined;
    return joined.slice(0, maxChars) + '...';
  }

  async deduplicate(records: MemoryRecord[]) {
    const seen = new Set<string>();
    return records.filter(r => {
      const key = r.text.slice(0, 120);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const defaultConsolidation = new ConsolidationManager();
