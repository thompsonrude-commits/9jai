import type { BenchmarkResult, RegressionFinding, HistoricalMetricsRecord } from './types';

export class RegressionAnalyzer {
  analyze(currentResults: BenchmarkResult[], history: HistoricalMetricsRecord[]): RegressionFinding[] {
    const findings: RegressionFinding[] = [];
    const historyByBenchmark = new Map<string, HistoricalMetricsRecord[]>();

    for (const record of history) {
      const key = `${record.suiteId}::${record.benchmarkId}::${record.targetId ?? 'unknown'}`;
      const list = historyByBenchmark.get(key) ?? [];
      list.push(record);
      historyByBenchmark.set(key, list);
    }

    for (const result of currentResults) {
      const key = `${result.suiteId}::${result.benchmarkId}::${result.targetId ?? 'unknown'}`;
      const baseline = historyByBenchmark.get(key)?.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
      if (!baseline) continue;

      const latencyMetric = result.metrics.find((m) => m.name === 'latency_ms');
      const baselineLatency = baseline.metrics.find((m) => m.name === 'latency_ms');
      if (latencyMetric && baselineLatency && latencyMetric.value > baselineLatency.value * 1.15) {
        findings.push({
          suiteId: result.suiteId,
          benchmarkId: result.benchmarkId,
          targetId: result.targetId,
          issue: 'Latency increased more than 15% compared to the last baseline',
          severity: 'medium',
          baselineValue: baselineLatency.value,
          currentValue: latencyMetric.value,
          timestamp: new Date().toISOString(),
        });
      }

      if (!result.success) {
        findings.push({
          suiteId: result.suiteId,
          benchmarkId: result.benchmarkId,
          targetId: result.targetId,
          issue: 'Benchmark execution reported failure',
          severity: 'high',
          timestamp: new Date().toISOString(),
        });
      }

      const scoreDrop = baseline.score - result.score;
      if (scoreDrop >= 10) {
        findings.push({
          suiteId: result.suiteId,
          benchmarkId: result.benchmarkId,
          targetId: result.targetId,
          issue: `Score dropped by ${scoreDrop.toFixed(1)} points since the last baseline`,
          severity: 'high',
          baselineValue: baseline.score,
          currentValue: result.score,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return findings;
  }
}
