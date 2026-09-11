import { getAllHealthSnapshots } from '../logger';
import type { ProviderHealth, ProviderId } from '../types';
import { getProviderStatusDetails, isProviderDisabled, isSecretConfigured } from '../providers/secretHelpers';
import { PROVIDER_DEFINITIONS, ProviderDefinition } from './authoritativeRegistry';
import * as comfyAdapter from './comfyAdapter';

export type ProviderVerificationReport = {
  providerId: ProviderId;
  displayName: string;
  secretName?: string;
  secretConfigured: boolean;
  disabled: boolean;
  // Health/status fields (legacy & new):
  status: 'disabled' | 'missing-secret' | 'auth-failed' | 'unavailable' | 'degraded' | 'healthy';
  // Higher-level implementation/readiness state for UI consumption:
  implementationState: 'IMPLEMENTED' | 'WIRED' | 'READY' | 'NOT_CONFIGURED' | 'AUTH_FAILED' | 'MODEL_NOT_FOUND' | 'UNAVAILABLE' | 'DISABLED' | 'PARTIAL' | 'NOT_IMPLEMENTED';
  health: ProviderHealth;
  ready: boolean;
  details: string;
};

// Use authoritative provider definitions
const PROVIDER_CONFIG: Array<ProviderDefinition> = PROVIDER_DEFINITIONS as any;

export async function getProviderVerificationReports(): Promise<Record<string, ProviderVerificationReport>> {
  const snapshots = getAllHealthSnapshots();

  return PROVIDER_CONFIG.reduce((reportMap, provider) => {
      // Default health snapshot lookup (used for providers that post health snapshots)
      const health = snapshots.find((snapshot) => snapshot.providerId === provider.providerId) ?? {
        providerId: provider.providerId,
        status: 'healthy',
        lastChecked: Date.now(),
        avgLatencyMs: 0,
        successRate: 0.5,
        consecutiveFailures: 0,
      };

      const disabled = isProviderDisabled(provider.providerId);
      const secretConfigured = isSecretConfigured(provider.secretName);

      // Special-case native-gpu / ComfyUI to return more detailed readiness flags
      if (provider.providerId === 'native-gpu') {
        try {
          // Cannot await inside reduce — mark as degraded, health check done separately
          reportMap[provider.providerId] = {
            providerId: provider.providerId,
            displayName: provider.displayName,
            secretName: provider.secretName,
            secretConfigured,
            disabled,
            status: 'degraded',
            implementationState: 'PARTIAL',
            health: { providerId: provider.providerId, status: 'degraded' as any, lastChecked: Date.now(), avgLatencyMs: 0, successRate: 0.5, consecutiveFailures: 0 } as ProviderHealth,
            ready: false,
            details: 'ComfyUI health check deferred — call /ai/health for live status',
          };
          return reportMap;
        } catch (err: any) {
          reportMap[provider.providerId] = {
            providerId: provider.providerId,
            displayName: provider.displayName,
            secretName: provider.secretName,
            secretConfigured,
            disabled,
            status: 'unavailable',
            implementationState: 'UNAVAILABLE',
            health,
            ready: false,
            details: `health check error: ${err?.message || String(err)}`,
          };

          return reportMap;
        }
      }

      const statusDetails = getProviderStatusDetails(health, !disabled, secretConfigured);
      const ready = statusDetails.status === 'healthy';

      // Derive a higher-level implementationState for frontend/UI clarity
      let implementationState: ProviderVerificationReport['implementationState'] = 'IMPLEMENTED';
      if (disabled) implementationState = 'DISABLED';
      else if (provider.secretName && !secretConfigured) implementationState = 'NOT_CONFIGURED';
      else if (statusDetails.status === 'healthy' && secretConfigured) implementationState = 'READY';
      else if (statusDetails.status === 'degraded') implementationState = 'PARTIAL';
      else if (statusDetails.status === 'auth-failed') implementationState = 'AUTH_FAILED';
      else if (statusDetails.status === 'unavailable') implementationState = 'UNAVAILABLE';

      reportMap[provider.providerId] = {
        providerId: provider.providerId,
        displayName: provider.displayName,
        secretName: provider.secretName,
        secretConfigured,
        disabled,
        status: statusDetails.status,
        implementationState,
        health,
        ready,
        details: statusDetails.details,
      };

      return reportMap;
  }, {} as Record<string, ProviderVerificationReport>);
}

/**
 * Lightweight probes for a compact provider list intended for frontend consumption.
 * Probes are intentionally inexpensive and limited to local endpoints or module availability.
 */
export async function getCompactProviderReports(): Promise<Array<{
  providerId: string;
  displayName: string;
  implementationState: ProviderVerificationReport['implementationState'];
  secretConfigured: boolean;
  disabled: boolean;
  reachable?: boolean;
  pingMs?: number | null;
  details?: string;
}>> {
  const reports: Array<any> = [];

  for (const provider of PROVIDER_CONFIG) {
    const disabled = isProviderDisabled(provider.providerId);
    const secretConfigured = isSecretConfigured(provider.secretName);

    // Default compact entry
    const entry: any = {
      providerId: provider.providerId,
      displayName: provider.displayName,
      implementationState: 'IMPLEMENTED',
      secretConfigured,
      disabled,
      reachable: undefined,
      pingMs: null,
      details: '',
    };

    if (disabled) {
      entry.implementationState = 'DISABLED';
      entry.details = 'Disabled by environment';
      reports.push(entry);
      continue;
    }

    if (provider.secretName && !secretConfigured) {
      entry.implementationState = 'NOT_CONFIGURED';
      entry.details = 'Secret missing';
      reports.push(entry);
      continue;
    }

    // Providers with local endpoints we can probe cheaply
    try {
      if (provider.providerId === 'ollama' || provider.providerId === 'ollama-vision') {
        const base = process.env.OLLAMA_URL || 'http://localhost:11434';
        const start = Date.now();
        const resp = await fetch(`${base}/api/tags`, { method: 'GET', signal: (AbortSignal as any).timeout?.(3000) ?? undefined }).catch(() => null);
        entry.reachable = !!(resp && resp.ok);
        entry.pingMs = resp ? Date.now() - start : null;
        entry.implementationState = entry.reachable ? 'READY' : 'PARTIAL';
        entry.details = entry.reachable ? 'Ollama reachable' : 'Ollama not reachable';
        reports.push(entry);
        continue;
      }

      if (provider.providerId === 'native-gpu') {
        const base = process.env.COMFYUI_ENDPOINT || process.env.COMFYUI_URL || process.env.COMFYUI || undefined;
        if (!base) {
          entry.implementationState = 'NOT_CONFIGURED';
          entry.details = 'ComfyUI endpoint not configured';
          reports.push(entry);
          continue;
        }
        const start = Date.now();
        const resp = await fetch(base, { method: 'GET', signal: (AbortSignal as any).timeout?.(3000) ?? undefined }).catch(() => null);
        entry.reachable = !!(resp && resp.ok);
        entry.pingMs = resp ? Date.now() - start : null;
        entry.implementationState = entry.reachable ? 'READY' : 'PARTIAL';
        entry.details = entry.reachable ? 'ComfyUI reachable' : 'ComfyUI not reachable';
        reports.push(entry);
        continue;
      }

      if (provider.providerId === 'tesseract') {
        // Check if tesseract.js can be loaded
        try {
          await import('tesseract.js');
          entry.reachable = true;
          entry.pingMs = 0;
          entry.implementationState = 'READY';
          entry.details = 'tesseract.js available';
        } catch (err) {
          entry.reachable = false;
          entry.pingMs = null;
          entry.implementationState = 'PARTIAL';
          entry.details = 'tesseract.js not available (npm install tesseract.js)';
        }
        reports.push(entry);
        continue;
      }

      // For hosted providers with secret configured, mark as WIRED (no active probe)
      if (provider.secretName && secretConfigured) {
        entry.implementationState = 'WIRED';
        entry.details = 'Secret present; lightweight health probe not performed';
        reports.push(entry);
        continue;
      }

      // Default: implemented but not actively probed
      entry.implementationState = 'IMPLEMENTED';
      entry.details = 'Provider adapter present; not probed';
      reports.push(entry);
    } catch (err: any) {
      entry.implementationState = 'UNAVAILABLE';
      entry.details = err?.message || String(err);
      entry.reachable = false;
      reports.push(entry);
    }
  }

  return reports;
}
