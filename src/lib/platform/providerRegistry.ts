/**
 * Provider Registry — Multi-provider health tracking and failover
 * Tracks availability of Groq, OpenRouter, Together, DeepSeek, etc.
 * Enables intelligent routing and automatic failover
 */

export interface ProviderConfig {
  id: string;
  name: string;
  endpoint: string;
  capabilities: string[]; // 'chat', 'vision', 'speech', 'image', etc.
  priority: number; // lower = higher priority
  enabled: boolean;
  requiresAuth: boolean;
  healthCheckUrl?: string;
}

export interface ProviderHealth {
  providerId: string;
  status: 'healthy' | 'degraded' | 'offline';
  lastCheck: number;
  lastSuccess: number;
  lastFailure: number;
  failureCount: number;
  successCount: number;
  averageLatency: number;
  errorMessage?: string;
}

export interface ProviderDiagnostics {
  offlineMode: boolean;
  activeProviders: string[];
  failedProviders: string[];
  bestProvider?: string;
  totalRequests: number;
  successRate: number;
}

class ProviderRegistry {
  private providers = new Map<string, ProviderConfig>();
  private health = new Map<string, ProviderHealth>();
  private offlineMode = false;
  private totalRequests = 0;
  private successfulRequests = 0;

  constructor() {
    this.initializeProviders();
    this.startHealthMonitoring();
  }

  private initializeProviders(): void {
    const defaultProviders: ProviderConfig[] = [
      {
        id: 'groq',
        name: 'Groq',
        endpoint: 'https://api.groq.com/openai/v1',
        capabilities: ['chat', 'speech'],
        priority: 1,
        enabled: true,
        requiresAuth: true,
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        endpoint: 'https://openrouter.ai/api/v1',
        capabilities: ['chat', 'vision'],
        priority: 2,
        enabled: true,
        requiresAuth: false, // free tier available
      },
      {
        id: 'together',
        name: 'Together AI',
        endpoint: 'https://api.together.xyz/v1',
        capabilities: ['chat', 'image', 'vision'],
        priority: 3,
        enabled: true,
        requiresAuth: true,
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        endpoint: 'https://api.deepseek.com/v1',
        capabilities: ['chat'],
        priority: 4,
        enabled: true,
        requiresAuth: true,
      },
      {
        id: 'proxy',
        name: 'Firebase Proxy',
        endpoint: '/api/v1',
        capabilities: ['chat', 'vision', 'speech', 'image', 'search'],
        priority: 0, // highest priority
        enabled: true,
        requiresAuth: false,
      },
    ];

    defaultProviders.forEach(p => {
      this.providers.set(p.id, p);
      this.health.set(p.id, {
        providerId: p.id,
        status: 'healthy',
        lastCheck: Date.now(),
        lastSuccess: Date.now(),
        lastFailure: 0,
        failureCount: 0,
        successCount: 0,
        averageLatency: 0,
      });
    });
  }

  public registerProvider(config: ProviderConfig): void {
    this.providers.set(config.id, config);
    if (!this.health.has(config.id)) {
      this.health.set(config.id, {
        providerId: config.id,
        status: 'healthy',
        lastCheck: Date.now(),
        lastSuccess: Date.now(),
        lastFailure: 0,
        failureCount: 0,
        successCount: 0,
        averageLatency: 0,
      });
    }
  }

  public getProvider(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  public getProviderHealth(id: string): ProviderHealth | undefined {
    return this.health.get(id);
  }

  public selectProvider(capability: string): ProviderConfig | null {
    const candidates = Array.from(this.providers.values())
      .filter(p => p.enabled && p.capabilities.includes(capability))
      .sort((a, b) => {
        const aHealth = this.health.get(a.id);
        const bHealth = this.health.get(b.id);
        
        // Prioritize healthy providers
        if (aHealth?.status === 'healthy' && bHealth?.status !== 'healthy') return -1;
        if (bHealth?.status === 'healthy' && aHealth?.status !== 'healthy') return 1;
        
        // Then by priority
        return a.priority - b.priority;
      });

    return candidates[0] ?? null;
  }

  public recordSuccess(providerId: string, latencyMs: number): void {
    const h = this.health.get(providerId);
    if (!h) return;

    h.lastSuccess = Date.now();
    h.lastCheck = Date.now();
    h.successCount++;
    h.failureCount = Math.max(0, h.failureCount - 1); // reduce failure count on success
    h.averageLatency = h.averageLatency === 0 
      ? latencyMs 
      : (h.averageLatency * 0.7 + latencyMs * 0.3);
    
    // Reset status to healthy after 2 consecutive successes
    if (h.successCount >= 2) {
      h.status = 'healthy';
    }

    this.totalRequests++;
    this.successfulRequests++;
    this.evaluateOfflineMode();
  }

  public recordFailure(providerId: string, error: string): void {
    const h = this.health.get(providerId);
    if (!h) return;

    h.lastFailure = Date.now();
    h.lastCheck = Date.now();
    h.failureCount++;
    h.errorMessage = error;

    // Mark as degraded after 2 failures, offline after 5
    if (h.failureCount >= 5) {
      h.status = 'offline';
    } else if (h.failureCount >= 2) {
      h.status = 'degraded';
    }

    this.totalRequests++;
    this.evaluateOfflineMode();
  }

  public getDiagnostics(capability: string): ProviderDiagnostics {
    const relevantProviders = Array.from(this.providers.values())
      .filter(p => p.capabilities.includes(capability));

    const activeProviders = relevantProviders
      .filter(p => {
        const h = this.health.get(p.id);
        return p.enabled && h?.status === 'healthy';
      })
      .map(p => p.id);

    const failedProviders = relevantProviders
      .filter(p => {
        const h = this.health.get(p.id);
        return h?.status === 'offline';
      })
      .map(p => p.id);

    const bestProvider = this.selectProvider(capability)?.id;
    const successRate = this.totalRequests > 0 
      ? this.successfulRequests / this.totalRequests 
      : 1;

    return {
      offlineMode: this.offlineMode,
      activeProviders,
      failedProviders,
      bestProvider,
      totalRequests: this.totalRequests,
      successRate,
    };
  }

  private evaluateOfflineMode(): void {
    const allProviders = Array.from(this.health.values());
    const onlineCount = allProviders.filter(h => h.status === 'healthy').length;
    
    // Enter offline mode if less than 20% providers are healthy
    this.offlineMode = onlineCount < allProviders.length * 0.2;
  }

  private startHealthMonitoring(): void {
    // Check provider health every 2 minutes
    setInterval(() => {
      this.health.forEach((h, id) => {
        const provider = this.providers.get(id);
        if (!provider?.enabled) return;

        // Auto-recover from degraded status after 5 minutes of no failures
        const timeSinceLastFailure = Date.now() - h.lastFailure;
        if (h.status === 'degraded' && timeSinceLastFailure > 5 * 60 * 1000) {
          h.status = 'healthy';
          h.failureCount = 0;
        }

        // Auto-recover from offline status after 10 minutes
        if (h.status === 'offline' && timeSinceLastFailure > 10 * 60 * 1000) {
          h.status = 'degraded';
          h.failureCount = 2;
        }
      });

      this.evaluateOfflineMode();
    }, 2 * 60 * 1000);
  }

  public getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  public getAllHealth(): ProviderHealth[] {
    return Array.from(this.health.values());
  }

  public setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }
}

export const providerRegistry = new ProviderRegistry();
