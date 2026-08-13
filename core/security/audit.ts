import type { AuditEngine, AuditRecord } from './types';

export class DefaultAuditEngine implements AuditEngine {
  private records: AuditRecord[] = [];

  async record(entry: Omit<AuditRecord, 'id' | 'timestamp'>): Promise<void> {
    this.records.push({
      id: `${entry.type}-${this.records.length + 1}`,
      timestamp: Date.now(),
      ...entry,
    });
  }

  async list(): Promise<AuditRecord[]> {
    return [...this.records];
  }
}
