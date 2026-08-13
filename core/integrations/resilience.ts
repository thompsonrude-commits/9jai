import type { CircuitBreakerManager, RetryManager, RetryPolicy } from './types';

export class DefaultRetryManager implements RetryManager {
  constructor(private readonly policy: RetryPolicy) {}

  async execute<T>(operation: () => Promise<T> | T): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.policy.maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt >= this.policy.maxAttempts) break;
        await new Promise((resolve) => setTimeout(resolve, this.policy.backoffMs));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

export class DefaultCircuitBreakerManager implements CircuitBreakerManager {
  private states = new Map<string, 'closed' | 'open' | 'half-open'>();
  private failures = new Map<string, number>();

  constructor(private readonly options: { failureThreshold: number; resetTimeoutMs: number }) {}

  async recordFailure(key: string): Promise<void> {
    const count = (this.failures.get(key) ?? 0) + 1;
    this.failures.set(key, count);
    if (count >= this.options.failureThreshold) {
      this.states.set(key, 'open');
    }
  }

  async recordSuccess(key: string): Promise<void> {
    this.failures.set(key, 0);
    this.states.set(key, 'closed');
  }

  getState(key: string): 'closed' | 'open' | 'half-open' {
    return this.states.get(key) ?? 'closed';
  }
}
