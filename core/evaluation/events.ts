import { EventEmitter } from 'events';
import type { EvaluationRunContext, BenchmarkResult, RegressionFinding, Recommendation, EvaluationReport } from './types';

export type EvaluationEvent =
  | { type: 'EvaluationStarted'; context: EvaluationRunContext }
  | { type: 'BenchmarkStarted'; suiteId: string; benchmarkId: string; context: EvaluationRunContext }
  | { type: 'BenchmarkCompleted'; result: BenchmarkResult }
  | { type: 'EvaluationCompleted'; report: EvaluationReport }
  | { type: 'RegressionDetected'; finding: RegressionFinding }
  | { type: 'RecommendationCreated'; recommendation: Recommendation };

class EvaluationEventBus extends EventEmitter {
  emitEvent(event: EvaluationEvent) {
    this.emit(event.type, event);
  }
}

export const evaluationEvents = new EvaluationEventBus();
