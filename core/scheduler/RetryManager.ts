export type RetryPolicy = {
  maxRetries?: number;
  backoffMs?: number;
};

export class RetryManager {
  private policy: RetryPolicy;

  constructor(policy?: RetryPolicy) {
    this.policy = policy ?? { maxRetries: 3, backoffMs: 200 };
  }

  shouldRetry(attempts: number): boolean {
    return attempts < (this.policy.maxRetries ?? 3);
  }

  backoff(attempts: number): number {
    const base = this.policy.backoffMs ?? 200;
    return base * Math.pow(2, attempts - 1);
  }
}
