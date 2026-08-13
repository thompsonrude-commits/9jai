import type { MetricSample, MetricsAggregator } from './types';

export class DefaultMetricsAggregator implements MetricsAggregator {
  private samples: MetricSample[] = [];

  record(sample: MetricSample): void {
    this.samples.push(sample);
  }

  summary(): Record<string, number> {
    return Object.fromEntries(this.samples.map((sample) => [sample.name, sample.value]));
  }
}
