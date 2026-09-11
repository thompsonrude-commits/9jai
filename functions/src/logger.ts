/**
 * Structured logger for the 9jai AI proxy layer
 * Writes to Firebase Functions logs + Firestore for analytics
 */

import * as admin from 'firebase-admin';
import { isSecretConfigured } from './providers/secretHelpers';
import { RequestLog, ProviderHealth, ProviderId } from './types';

// ── In-memory health state (per function instance) ─────────────────────────

const healthState = new Map<ProviderId, ProviderHealth>();

export function getProviderHealth(id: ProviderId): ProviderHealth {
  return healthState.get(id) ?? {
    providerId: id,
    status: 'healthy',
    lastChecked: Date.now(),
    avgLatencyMs: 500,
    successRate: 1.0,
    consecutiveFailures: 0,
  };
}

export function recordProviderSuccess(id: ProviderId, latencyMs: number): void {
  const h = getProviderHealth(id);
  const newAvg = Math.round((h.avgLatencyMs * 0.8) + (latencyMs * 0.2)); // EMA
  const newRate = Math.min(1.0, (h.successRate * 9 + 1.0) / 10);
  healthState.set(id, {
    ...h,
    status: 'healthy',
    lastChecked: Date.now(),
    avgLatencyMs: newAvg,
    successRate: newRate,
    consecutiveFailures: 0,
  });
}

export function recordProviderFailure(id: ProviderId, error: string): void {
  const h = getProviderHealth(id);

  // Detect network-level DNS / host resolution failures which are non-retryable
  // e.g. ENOTFOUND, getaddrinfo ENOTFOUND, "No such host is known"
  const lower = (error || '').toLowerCase();
  const isDnsFailure = lower.includes('enotfound') || lower.includes('getaddrinfo') || lower.includes('no such host');

  // If DNS/host resolution failed, mark provider immediately as 'down' and set a high consecutiveFailures
  if (isDnsFailure) {
    healthState.set(id, {
      ...h,
      status: 'down',
      lastChecked: Date.now(),
      avgLatencyMs: h.avgLatencyMs,
      successRate: 0,
      consecutiveFailures: Math.max(h.consecutiveFailures || 0, 10),
      lastError: error,
    });
    console.error(`[9jai] Provider ${id} DNS/host failure: ${error} — marking as down`);
    return;
  }

  const failures = h.consecutiveFailures + 1;
  const newRate = Math.max(0, (h.successRate * 9 + 0.0) / 10);
  const status = failures >= 5 ? 'down' : failures >= 2 ? 'degraded' : 'healthy';
  healthState.set(id, {
    ...h,
    status,
    lastChecked: Date.now(),
    successRate: newRate,
    consecutiveFailures: failures,
    lastError: error,
  });
  console.error(`[9jai] Provider ${id} failure #${failures}: ${error}`);
}

// ── Request logging ────────────────────────────────────────────────────────

function removeUndefinedValues<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function logRequest(log: RequestLog): Promise<void> {
  // Always log to console (visible in Firebase Functions logs)
  const level = log.success ? 'info' : 'warn';
  console[level](JSON.stringify({
    type: 'request',
    requestId: log.requestId,
    task: log.task,
    provider: log.provider,
    model: log.model,
    latencyMs: log.latencyMs,
    tokensUsed: log.tokensUsed,
    cached: log.cached,
    success: log.success,
    error: log.error,
    userId: log.userId,
    timestamp: new Date(log.timestamp).toISOString(),
  }));

  // Write to Firestore for analytics (non-blocking, best-effort)
  try {
    const db = admin.firestore();
    try {
      // Avoid Firestore errors when objects contain undefined properties
      // (some requests may omit userId/sessionId in unauthenticated flows)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db as any).settings?.({ ignoreUndefinedProperties: true });
    } catch (e) {
      // ignore
    }

    await db.collection('ai_request_logs').add(
      removeUndefinedValues({
        ...log,
        createdAt: Date.now(),
      }),
    );
  } catch (err) {
    // Never let logging failures break the main request
    console.warn('[9jai] Failed to write log to Firestore:', err);
  }
}

// ── Provider health snapshot ───────────────────────────────────────────────

export function getAllHealthSnapshots(): ProviderHealth[] {
  return Array.from(healthState.values());
}

import { PROVIDER_DEFINITIONS } from './media/authoritativeRegistry';

export function isProviderAvailable(id: ProviderId): boolean {
  // Lookup provider definition
  const def = PROVIDER_DEFINITIONS.find(d => d.providerId === id);
  if (!def) return false;

  // If provider is explicitly disabled via environment, mark unavailable
  try {
    const disabled = (process.env[`DISABLE_${String(id).toUpperCase()}`] || process.env[`PROVIDER_${String(id).toUpperCase()}_DISABLED`] || process.env[`PROVIDER_${String(id).toUpperCase()}_ENABLED`]) as string | undefined;
    if (typeof disabled === 'string' && (disabled.trim().toLowerCase() === 'true')) return false;
  } catch {
    // ignore
  }

  // If definition requires a secret, verify it
  if (def.secretName && !isSecretConfigured(def.secretName)) return false;

  const h = getProviderHealth(id);
  if (h.status === 'down') return false;
  if (h.consecutiveFailures >= 3) return false;

  const lastError = (h as any).lastError as string | undefined;
  if (lastError) {
    const lower = lastError.toLowerCase();
    if (lower.includes('401') || lower.includes('invalid api key') || lower.includes('invalid_api_key') || lower.includes('unauthorized') || lower.includes('forbidden')) {
      return false;
    }
    if (lower.includes('enotfound') || lower.includes('getaddrinfo') || lower.includes('no such host')) {
      return false;
    }
  }

  return true;
}

// ── Latency tracker ────────────────────────────────────────────────────────

export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
