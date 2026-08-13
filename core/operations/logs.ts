import type { LogAggregationEngine, LogEntry } from './types';

export class DefaultLogAggregationEngine implements LogAggregationEngine {
  private logs: LogEntry[] = [];

  async ingest(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    this.logs.push({ id: `${entry.source}-${this.logs.length + 1}`, timestamp: Date.now(), ...entry });
  }

  async search(query: string): Promise<LogEntry[]> {
    return this.logs.filter((entry) => entry.message.toLowerCase().includes(query.toLowerCase()));
  }
}
