import { evaluationEvents } from './events';
import type { EvaluationRunContext, BenchmarkResult, HistoricalMetricsDatabase, BenchmarkSuiteDescriptor, EvaluationReport } from './types';
import { BenchmarkSuiteRegistry } from './BenchmarkSuiteRegistry';
import { InMemoryMetricsStore } from './MetricsStore';
import { RegressionAnalyzer } from './RegressionAnalyzer';
import { ScoringEngine } from './ScoringEngine';
import { ReportGenerator } from './ReportGenerator';

export class EvaluationEngine {
  private readonly suiteRegistry: BenchmarkSuiteRegistry;
  private readonly metricsStore: HistoricalMetricsDatabase;
  private readonly regressionAnalyzer = new RegressionAnalyzer();
  private readonly scoringEngine = new ScoringEngine();
  private readonly reportGenerator = new ReportGenerator();

  constructor(options?: { suiteRegistry?: BenchmarkSuiteRegistry; metricsStore?: HistoricalMetricsDatabase }) {
    this.suiteRegistry = options?.suiteRegistry ?? new BenchmarkSuiteRegistry();
    this.metricsStore = options?.metricsStore ?? new InMemoryMetricsStore();
  }

  registerSuite(suite: BenchmarkSuiteDescriptor): void {
    this.suiteRegistry.register(suite);
  }

  listSuites() {
    return this.suiteRegistry.list();
  }

  async runSuite(suiteId: string, context: EvaluationRunContext): Promise<EvaluationReport> {
    const suite = this.suiteRegistry.get(suiteId);
    if (!suite) throw new Error(`Benchmark suite ${suiteId} is not registered`);
    evaluationEvents.emitEvent({ type: 'EvaluationStarted', context });

    const benchmarkContext = { ...context, timestamp: new Date().toISOString() };
    evaluationEvents.emitEvent({ type: 'BenchmarkStarted', suiteId: suite.suiteId, benchmarkId: suite.suiteId, context: benchmarkContext });
    const result = await suite.execute(benchmarkContext);
    result.score = this.scoringEngine.calculateScore(result);
    result.benchmarkId = result.benchmarkId || suite.suiteId;
    await this.metricsStore.save({
      id: `${result.suiteId}-${result.benchmarkId}-${Date.now()}`,
      suiteId: result.suiteId,
      benchmarkId: result.benchmarkId,
      targetId: result.targetId,
      targetType: result.targetType,
      metrics: result.metrics,
      score: result.score,
      success: result.success,
      timestamp: result.timestamp,
    });
    evaluationEvents.emitEvent({ type: 'BenchmarkCompleted', result });

    const history = await this.metricsStore.query({ suiteId: result.suiteId, benchmarkId: result.benchmarkId, targetId: result.targetId });
    const regressions = this.regressionAnalyzer.analyze([result], history);
    const recommendations = this.scoringEngine.recommend(result);
    const report = this.reportGenerator.generateReport(context, [result], regressions, recommendations, undefined);
    evaluationEvents.emitEvent({ type: 'EvaluationCompleted', report });
    return report;
  }

  async queryHistory(query: Parameters<HistoricalMetricsDatabase['query']>[0]) {
    return this.metricsStore.query(query);
  }
}

export default EvaluationEngine;
