/**
 * ProviderRegistry.ts
 *
 * Singleton registry that tracks all available AI provider instances. Engines
 * query the registry to obtain the best available provider for a given
 * capability rather than hard-coding provider references.
 *
 * TODO Phase 2: Add priority ordering per capability
 * TODO Phase 3: Implement automatic failover when primary provider degrades
 * TODO Phase 3: Persist provider health history for observability dashboards
 */

import { BaseProvider, type ProviderHealthReport, type ProviderStatus } from './BaseProvider';
import type { ModelCapability } from '../models/ModelManager';

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export interface RegistryEntry {
  provider: BaseProvider;
  capabilities: ModelCapability[];
  priority: number;              // lower = higher priority
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// ProviderRegistry interface
// ---------------------------------------------------------------------------

export interface IProviderRegistry {
  /**
   * Register a provider with its supported capabilities and priority.
   */
  register(
    provider: BaseProvider,
    capabilities: ModelCapability[],
    priority?: number
  ): void;

  /**
   * Deregister a provider by its ID.
   */
  unregister(providerId: string): void;

  /**
   * Get a specific provider by ID.
   */
  get(providerId: string): BaseProvider | undefined;

  /**
   * Get the highest-priority enabled provider for a capability.
   */
  getBestFor(capability: ModelCapability): BaseProvider | undefined;

  /**
   * Get all enabled providers that support a capability, ordered by priority.
   */
  getAllFor(capability: ModelCapability): BaseProvider[];

  /**
   * Run health checks on all registered providers.
   */
  healthCheckAll(): Promise<Record<string, ProviderHealthReport>>;

  /**
   * Enable or disable a provider by ID.
   */
  setEnabled(providerId: string, enabled: boolean): void;

  /**
   * Return the overall status of a provider.
   */
  getStatus(providerId: string): ProviderStatus | undefined;

  /**
   * List all registered providers.
   */
  list(): RegistryEntry[];
}

// ---------------------------------------------------------------------------
// Default implementation scaffold
// ---------------------------------------------------------------------------

export class ProviderRegistry implements IProviderRegistry {
  private entries = new Map<string, RegistryEntry>();

  register(
    provider: BaseProvider,
    capabilities: ModelCapability[],
    priority = 100
  ): void {
    this.entries.set(provider.providerId, {
      provider,
      capabilities,
      priority,
      enabled: true,
    });
  }

  unregister(providerId: string): void {
    this.entries.delete(providerId);
  }

  get(providerId: string): BaseProvider | undefined {
    return this.entries.get(providerId)?.provider;
  }

  getBestFor(capability: ModelCapability): BaseProvider | undefined {
    return this.getAllFor(capability)[0];
  }

  getAllFor(capability: ModelCapability): BaseProvider[] {
    return [...this.entries.values()]
      .filter((e) => e.enabled && e.capabilities.includes(capability))
      .sort((a, b) => a.priority - b.priority)
      .map((e) => e.provider);
  }

  async healthCheckAll(): Promise<Record<string, ProviderHealthReport>> {
    const results: Record<string, ProviderHealthReport> = {};
    await Promise.allSettled(
      [...this.entries.values()].map(async ({ provider }) => {
        results[provider.providerId] = await provider.healthCheck();
      })
    );
    return results;
  }

  setEnabled(providerId: string, enabled: boolean): void {
    const entry = this.entries.get(providerId);
    if (entry) entry.enabled = enabled;
  }

  getStatus(providerId: string): ProviderStatus | undefined {
    // TODO Phase 3: Return cached status from last health check
    return this.entries.get(providerId) ? 'active' : undefined;
  }

  list(): RegistryEntry[] {
    return [...this.entries.values()];
  }
}
