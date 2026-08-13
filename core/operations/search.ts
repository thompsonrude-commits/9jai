import type { SearchEngine } from './types';

export class DefaultSearchEngine implements SearchEngine {
  private readonly index = [
    'engine',
    'agent',
    'workflow',
    'plugin',
    'connector',
    'configuration',
    'feature-flags',
    'release',
    'incident',
    'documentation',
    'dashboard',
  ];

  async search(query: string): Promise<string[]> {
    const normalized = query.toLowerCase();
    return this.index.filter((entry) => entry.includes(normalized) || normalized.includes(entry));
  }
}
