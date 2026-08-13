import type { HistoricalMetricsDatabase, HistoricalMetricsRecord, MetricsQuery } from './types';

export class InMemoryMetricsStore implements HistoricalMetricsDatabase {
  private readonly records: HistoricalMetricsRecord[] = [];

  async save(record: HistoricalMetricsRecord): Promise<void> {
    this.records.push({ ...record });
  }

  async query(query: MetricsQuery): Promise<HistoricalMetricsRecord[]> {
    return this.records.filter((record) => {
      if (query.suiteId && record.suiteId !== query.suiteId) return false;
      if (query.benchmarkId && record.benchmarkId !== query.benchmarkId) return false;
      if (query.targetId && record.targetId !== query.targetId) return false;
      if (query.targetType && record.targetType !== query.targetType) return false;
      if (query.from && record.timestamp < query.from) return false;
      if (query.to && record.timestamp > query.to) return false;
      return true;
    });
  }

  async latest(query: MetricsQuery): Promise<HistoricalMetricsRecord | undefined> {
    const results = await this.query(query);
    return results.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  }
}
