import type { BenchmarkResult, Recommendation } from './types';

export class ScoringEngine {
  calculateScore(result: BenchmarkResult): number {
    const base = result.success ? 75 : 40;
    const qualityMetric = result.metrics.find((m) => m.name === 'quality_score')?.value ?? 0;
    const latencyPenalty = Math.min(20, (result.metrics.find((m) => m.name === 'latency_ms')?.value ?? 0) / 100);
    const reliabilityBonus = result.metrics.find((m) => m.name === 'success_rate')?.value ?? 0;
    return Math.max(0, Math.min(100, base + qualityMetric * 0.2 + reliabilityBonus * 0.3 - latencyPenalty));
  }

  recommend(result: BenchmarkResult): Recommendation[] {
    const recs: Recommendation[] = [];
    const latencyMetric = result.metrics.find((m) => m.name === 'latency_ms');
    const successRate = result.metrics.find((m) => m.name === 'success_rate')?.value ?? 100;

    if (latencyMetric && latencyMetric.value > 2000) {
      recs.push({
        id: `rec-${result.benchmarkId}-latency`,
        title: 'Reduce benchmark latency',
        description: 'The benchmark indicates high latency. Review model selection, batch sizing, and pipeline resource allocation.',
        category: 'resource',
        priority: 80,
        targetId: result.targetId,
        createdAt: new Date().toISOString(),
      });
    }

    if (successRate < 90) {
      recs.push({
        id: `rec-${result.benchmarkId}-reliability`,
        title: 'Improve execution reliability',
        description: 'The benchmark success rate is below 90%. Investigate model stability, fallback routing, and error handling.',
        category: 'workflow',
        priority: 90,
        targetId: result.targetId,
        createdAt: new Date().toISOString(),
      });
    }

    return recs;
  }
}
