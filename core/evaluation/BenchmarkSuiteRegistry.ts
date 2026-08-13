import type { BenchmarkSuiteDescriptor } from './types';

export class BenchmarkSuiteRegistry {
  private readonly suites = new Map<string, BenchmarkSuiteDescriptor>();

  register(suite: BenchmarkSuiteDescriptor): void {
    if (this.suites.has(suite.suiteId)) {
      throw new Error(`Benchmark suite ${suite.suiteId} already registered`);
    }
    this.suites.set(suite.suiteId, suite);
  }

  unregister(suiteId: string): void {
    this.suites.delete(suiteId);
  }

  get(suiteId: string): BenchmarkSuiteDescriptor | undefined {
    return this.suites.get(suiteId);
  }

  list(): BenchmarkSuiteDescriptor[] {
    return Array.from(this.suites.values());
  }

  listByCategory(category: string): BenchmarkSuiteDescriptor[] {
    return this.list().filter((suite) => suite.category === category);
  }

  listByPlugin(pluginId: string): BenchmarkSuiteDescriptor[] {
    return this.list().filter((suite) => suite.pluginId === pluginId);
  }
}
