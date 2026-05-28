/**
 * Structured logger for the 9jai AI proxy layer
 * Writes to Firebase Functions logs + Firestore for analytics
 */

import * as admin from 'firebase-admin';
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
    await db.collection('ai_request_logs').add({
      ...log,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Never let logging failures break the main request
    console.warn('[9jai] Failed to write log to Firestore:', err);
  }
}

// ── Provider health snapshot ───────────────────────────────────────────────

export function getAllHealthSnapshots(): ProviderHealth[] {
  return Array.from(healthState.values());
}

export function isProviderAvailable(id: ProviderId): boolean {
  const h = getProviderHealth(id);
  // Mark as unavailable if down or if last check was recent and it's degraded
  if (h.status === 'down') return false;
  if (h.consecutiveFailures >= 3) return false;
  return true;
}

// ── Latency tracker ────────────────────────────────────────────────────────

export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
