import type { TrustLedger, TrustRecord } from './types';

export class DefaultTrustLedger implements TrustLedger {
  private records: TrustRecord[] = [];

  async record(entry: Omit<TrustRecord, 'id' | 'timestamp'>): Promise<void> {
    this.records.push({
      id: `${entry.action}-${this.records.length + 1}`,
      timestamp: Date.now(),
      ...entry,
    });
  }

  async list(): Promise<TrustRecord[]> {
    return [...this.records];
  }
}
