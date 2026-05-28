"use strict";
/**
 * Structured logger for the 9jai AI proxy layer
 * Writes to Firebase Functions logs + Firestore for analytics
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProviderHealth = getProviderHealth;
exports.recordProviderSuccess = recordProviderSuccess;
exports.recordProviderFailure = recordProviderFailure;
exports.logRequest = logRequest;
exports.getAllHealthSnapshots = getAllHealthSnapshots;
exports.isProviderAvailable = isProviderAvailable;
exports.startTimer = startTimer;
const admin = __importStar(require("firebase-admin"));
// ── In-memory health state (per function instance) ─────────────────────────
const healthState = new Map();
function getProviderHealth(id) {
    return healthState.get(id) ?? {
        providerId: id,
        status: 'healthy',
        lastChecked: Date.now(),
        avgLatencyMs: 500,
        successRate: 1.0,
        consecutiveFailures: 0,
    };
}
function recordProviderSuccess(id, latencyMs) {
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
function recordProviderFailure(id, error) {
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
async function logRequest(log) {
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
    }
    catch (err) {
        // Never let logging failures break the main request
        console.warn('[9jai] Failed to write log to Firestore:', err);
    }
}
// ── Provider health snapshot ───────────────────────────────────────────────
function getAllHealthSnapshots() {
    return Array.from(healthState.values());
}
function isProviderAvailable(id) {
    const h = getProviderHealth(id);
    // Mark as unavailable if down or if last check was recent and it's degraded
    if (h.status === 'down')
        return false;
    if (h.consecutiveFailures >= 3)
        return false;
    return true;
}
// ── Latency tracker ────────────────────────────────────────────────────────
function startTimer() {
    const start = Date.now();
    return () => Date.now() - start;
}
//# sourceMappingURL=logger.js.map