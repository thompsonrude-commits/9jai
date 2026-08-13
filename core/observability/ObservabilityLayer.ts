/**
 * ObservabilityLayer.ts
 *
 * Phase 15 refinement: structured metrics, tracing, health monitoring,
 * and error reporting for the AI platform.
 */

export interface MetricSample {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface TraceSpan {
  traceId: string;
  component: string;
  status: 'ok' | 'error';
  message?: string;
}

export interface ErrorReport {
  component: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  frequency: number;
  userImpact: string;
  message: string;
}

export interface ObservabilityLayer {
  recordMetric(sample: MetricSample): void;
  startTrace(component: string): string;
  completeTrace(traceId: string, component: string, status: 'ok' | 'error', message?: string): void;
  reportError(report: ErrorReport): void;
  getHealthSummary(): Promise<Record<string, string>>;
}

export class DefaultObservabilityLayer implements ObservabilityLayer {
  private readonly traces: TraceSpan[] = [];
  private readonly metrics: MetricSample[] = [];
  private readonly errors: ErrorReport[] = [];

  recordMetric(sample: MetricSample): void {
    this.metrics.push(sample);
  }

  startTrace(component: string): string {
    const traceId = `${component}-${Date.now()}`;
    this.traces.push({ traceId, component, status: 'ok' });
    return traceId;
  }

  completeTrace(traceId: string, component: string, status: 'ok' | 'error', message?: string): void {
    this.traces.push({ traceId, component, status });
  }

  reportError(report: ErrorReport): void {
    this.errors.push(report);
  }

  async getHealthSummary(): Promise<Record<string, string>> {
    return {
      metrics: `${this.metrics.length} samples`,
      traces: `${this.traces.length} spans`,
      errors: `${this.errors.length} reports`,
    };
  }
}
