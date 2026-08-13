import type { ConnectionPoolManager, RateLimitingEngine } from './types';

export class DefaultConnectionPoolManager implements ConnectionPoolManager {
  private resources = new Map<string, unknown[]>();

  async acquire(key: string): Promise<unknown> {
    const pool = this.resources.get(key) ?? [];
    const resource = pool.shift();
    if (resource) {
      this.resources.set(key, pool);
      return resource;
    }
    return { key, pooled: false };
  }

  async release(key: string, resource: unknown): Promise<void> {
    const pool = this.resources.get(key) ?? [];
    pool.push(resource);
    this.resources.set(key, pool);
  }
}

export class DefaultRateLimitingEngine implements RateLimitingEngine {
  private counters = new Map<string, number>();

  allow(key: string): boolean {
    const current = this.counters.get(key) ?? 0;
    if (current >= 100) {
      return false;
    }
    this.counters.set(key, current + 1);
    return true;
  }
}
