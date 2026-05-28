"use strict";
/**
 * Response cache for the 9jai AI proxy layer
 * Two-tier: in-memory (fast) + Firestore (persistent across instances)
 * Optimized for African bandwidth — reduces repeat API calls
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
exports.buildCacheKey = buildCacheKey;
exports.getFromMemCache = getFromMemCache;
exports.setInMemCache = setInMemCache;
exports.getFromFirestoreCache = getFromFirestoreCache;
exports.setInFirestoreCache = setInFirestoreCache;
exports.getCached = getCached;
exports.setCached = setCached;
exports.getMemCacheStats = getMemCacheStats;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
// ── In-memory L1 cache ─────────────────────────────────────────────────────
const memCache = new Map();
const MAX_MEM_ENTRIES = 500;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
// ── Cache key builder ──────────────────────────────────────────────────────
function buildCacheKey(task, content, model) {
    const raw = `${task}:${model ?? ''}:${content}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}
// ── L1 memory cache ────────────────────────────────────────────────────────
function getFromMemCache(key) {
    const entry = memCache.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.createdAt > entry.ttlMs) {
        memCache.delete(key);
        return null;
    }
    entry.hitCount++;
    return entry;
}
function setInMemCache(key, value, provider, model, ttlMs = DEFAULT_TTL_MS) {
    // Evict oldest entries if at capacity
    if (memCache.size >= MAX_MEM_ENTRIES) {
        const oldest = Array.from(memCache.entries())
            .sort((a, b) => a[1].createdAt - b[1].createdAt)
            .slice(0, 50)
            .map(([k]) => k);
        oldest.forEach(k => memCache.delete(k));
    }
    memCache.set(key, {
        key,
        value,
        provider,
        model,
        createdAt: Date.now(),
        ttlMs,
        hitCount: 0,
    });
}
// ── L2 Firestore cache ─────────────────────────────────────────────────────
async function getFromFirestoreCache(key) {
    try {
        const db = admin.firestore();
        const doc = await db.collection('ai_cache').doc(key).get();
        if (!doc.exists)
            return null;
        const entry = doc.data();
        if (Date.now() - entry.createdAt > entry.ttlMs) {
            // Expired — delete async
            doc.ref.delete().catch(() => { });
            return null;
        }
        // Promote to L1
        setInMemCache(key, entry.value, entry.provider, entry.model, entry.ttlMs);
        return entry;
    }
    catch (err) {
        console.warn('[Cache] Firestore read failed:', err);
        return null;
    }
}
async function setInFirestoreCache(key, value, provider, model, ttlMs = DEFAULT_TTL_MS) {
    try {
        const db = admin.firestore();
        const entry = {
            key,
            value,
            provider,
            model,
            createdAt: Date.now(),
            ttlMs,
            hitCount: 0,
        };
        await db.collection('ai_cache').doc(key).set(entry);
    }
    catch (err) {
        console.warn('[Cache] Firestore write failed:', err);
    }
}
// ── Unified cache lookup ───────────────────────────────────────────────────
async function getCached(key) {
    // L1 first (fast)
    const mem = getFromMemCache(key);
    if (mem) {
        console.info(`[Cache] L1 hit: ${key.slice(0, 8)}...`);
        return mem;
    }
    // L2 fallback (persistent)
    const fs = await getFromFirestoreCache(key);
    if (fs) {
        console.info(`[Cache] L2 hit: ${key.slice(0, 8)}...`);
        return fs;
    }
    return null;
}
async function setCached(key, value, provider, model, ttlMs = DEFAULT_TTL_MS) {
    setInMemCache(key, value, provider, model, ttlMs);
    // Write to Firestore async (non-blocking)
    setInFirestoreCache(key, value, provider, model, ttlMs).catch(() => { });
}
// ── Cache stats ────────────────────────────────────────────────────────────
function getMemCacheStats() {
    return { size: memCache.size, entries: memCache.size };
}
//# sourceMappingURL=cache.js.map