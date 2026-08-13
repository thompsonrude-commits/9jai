import type { MetricsCollector } from './types';

export class DefaultMetricsCollector implements MetricsCollector {
  private metrics = new Map<string, number>();

  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics.entries());
  }
}
