/**
 * Platform Index — Unified export for all core platform services
 * Provides centralized access to provider registry, recovery service, and knowledge engine
 */

import { providerRegistry } from './providerRegistry';
import { recoveryService } from './recoveryService';
import { knowledgeEngine } from './knowledgeEngine';
import type { QueueStatus } from './recoveryService';

export { providerRegistry };
export type { ProviderConfig, ProviderHealth, ProviderDiagnostics } from './providerRegistry';

export { recoveryService };
export type { QueuedRequest, RecoveryService, QueueStatus } from './recoveryService';

export { knowledgeEngine };
export type { KnowledgeEntry, SemanticSearchResult } from './knowledgeEngine';

export { platformAnalytics, trackChatRequest, trackVisionRequest, trackImageGeneration, getPerformanceMetrics, flushAnalytics } from './analytics';
export type { AnalyticsEvent, PerformanceMetrics, UsageStats } from './analytics';

// Platform initialization
export async function initializePlatform(): Promise<void> {
  console.log('[Platform] Initializing core services...');
  
  try {
    // Initialize knowledge engine
    await knowledgeEngine.initialize();
    console.log('[Platform] Knowledge engine initialized');

    // Load knowledge from Firestore
    const loaded = await knowledgeEngine.loadFromFirestore();
    console.log(`[Platform] Loaded ${loaded} knowledge entries from Firestore`);

    console.log('[Platform] Core services ready');
  } catch (err) {
    console.warn('[Platform] Initialization warning:', err);
  }
}

// Platform diagnostics
export function getPlatformDiagnostics(): {
  providers: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
  };
  recovery: QueueStatus;
  knowledge: {
    totalEntries: number;
    byType: Record<string, number>;
    byLanguage: Record<string, number>;
  };
} {
  const allHealth = providerRegistry.getAllHealth();
  
  return {
    providers: {
      total: allHealth.length,
      healthy: allHealth.filter(h => h.status === 'healthy').length,
      degraded: allHealth.filter(h => h.status === 'degraded').length,
      offline: allHealth.filter(h => h.status === 'offline').length,
    },
    recovery: recoveryService.getQueueStatus(),
    knowledge: knowledgeEngine.getStats(),
  };
}
