/**
 * BaseProvider.ts
 *
 * Abstract base class that all AI provider adapters must extend. Defines the
 * common lifecycle (init, healthCheck, teardown) and shared utility methods
 * for authentication, retry logic, and rate-limit handling.
 *
 * TODO Phase 2: Add exponential backoff retry helper
 * TODO Phase 2: Implement token-bucket rate limiter per provider
 * TODO Phase 3: Add cost-tracking hooks to every API call
 */

import type { ProviderConfig } from '../utils/types';

// ---------------------------------------------------------------------------
// Provider status
// ---------------------------------------------------------------------------

export type ProviderStatus = 'active' | 'degraded' | 'unavailable' | 'unconfigured';

export interface ProviderHealthReport {
  providerId: string;
  status: ProviderStatus;
  latencyMs?: number;
  errorMessage?: string;
  checkedAt: Date;
}

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export abstract class BaseProvider {
  readonly providerId: string;
  readonly displayName: string;

  protected config: ProviderConfig;
  protected status: ProviderStatus = 'unconfigured';

  constructor(providerId: string, displayName: string, config: ProviderConfig) {
    this.providerId = providerId;
    this.displayName = displayName;
    this.config = config;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle — must be implemented by subclasses
  // ---------------------------------------------------------------------------

  /**
   * Initialise the provider: validate credentials, warm up connections.
   */
  abstract initialize(): Promise<void>;

  /**
   * Gracefully release all resources held by this provider.
   */
  abstract teardown(): Promise<void>;

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------

  /**
   * Perform a lightweight liveness check against the provider's API.
   */
  abstract healthCheck(): Promise<ProviderHealthReport>;

  // ---------------------------------------------------------------------------
  // Shared utilities (available to all subclasses)
  // ---------------------------------------------------------------------------

  protected getStatus(): ProviderStatus {
    return this.status;
  }

  protected setStatus(status: ProviderStatus): void {
    this.status = status;
  }

  /**
   * TODO Phase 2: Implement exponential backoff retry.
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    _maxAttempts = 3
  ): Promise<T> {
    // Placeholder — executes fn once until retry logic is implemented
    return fn();
  }

  /**
   * TODO Phase 3: Deduct from cost budget and emit cost event.
   */
  protected trackCost(_tokensUsed: number, _model: string): void {
    // no-op until Phase 3
  }
}
