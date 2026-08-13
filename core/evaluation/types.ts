export type EvaluationStage =
  | 'prepare'
  | 'load_model'
  | 'execute'
  | 'collect_metrics'
  | 'validate'
  | 'score'
  | 'store_history'
  | 'generate_recommendations'
  | 'publish_report';

export type BenchmarkTargetType = 'model' | 'engine' | 'workflow' | 'plugin' | 'pipeline';

export interface EvaluationRunContext {
  runId: string;
  suiteId: string;
  requestId?: string;
  targetId?: string;
  targetType?: BenchmarkTargetType;
  parameters?: Record<string, unknown>;
  timestamp: string;
}

export interface EvaluationMetric {
  name: string;
  value: number;
  units?: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface BenchmarkResult {
  suiteId: string;
  benchmarkId: string;
  targetId?: string;
  targetType?: BenchmarkTargetType;
  success: boolean;
  durationMs: number;
  metrics: EvaluationMetric[];
  score: number;
  details?: string;
  timestamp: string;
}

export interface BenchmarkSuiteDescriptor {
  suiteId: string;
  name: string;
  description: string;
  category: string;
  version: string;
  supportedTargets: BenchmarkTargetType[];
  pluginId?: string;
  execute: (context: EvaluationRunContext) => Promise<BenchmarkResult>;
}

export interface RegressionFinding {
  suiteId: string;
  benchmarkId: string;
  targetId?: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  baselineValue?: number;
  currentValue?: number;
  timestamp: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'model' | 'pipeline' | 'resource' | 'workflow' | 'plugin' | 'general';
  priority: number;
  targetId?: string;
  createdAt: string;
}

export interface VersionComparison {
  baselineVersion: string;
  currentVersion: string;
  changes: string[];
  scoreDelta?: number;
}

export interface EvaluationReport {
  reportId: string;
  generatedAt: string;
  runContext: EvaluationRunContext;
  summary: {
    totalBenchmarks: number;
    passed: number;
    failed: number;
    averageScore: number;
    alerts: number;
  };
  results: BenchmarkResult[];
  regressions: RegressionFinding[];
  recommendations: Recommendation[];
  versionComparison?: VersionComparison;
}

export interface HistoricalMetricsRecord {
  id: string;
  suiteId: string;
  benchmarkId: string;
  targetId?: string;
  targetType?: BenchmarkTargetType;
  metrics: EvaluationMetric[];
  score: number;
  success: boolean;
  timestamp: string;
}

export interface MetricsQuery {
  suiteId?: string;
  benchmarkId?: string;
  targetId?: string;
  targetType?: BenchmarkTargetType;
  from?: string;
  to?: string;
}

export interface HistoricalMetricsDatabase {
  save(record: HistoricalMetricsRecord): Promise<void>;
  query(query: MetricsQuery): Promise<HistoricalMetricsRecord[]>;
  latest(query: MetricsQuery): Promise<HistoricalMetricsRecord | undefined>;
}
