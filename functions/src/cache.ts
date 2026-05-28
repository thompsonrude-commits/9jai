/**
 * Response cache for the 9jai AI proxy layer
 * Two-tier: in-memory (fast) + Firestore (persistent across instances)
 * Optimized for African bandwidth — reduces repeat API calls
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { CacheEntry, ProviderId } from './types';

// ── In-memory L1 cache ─────────────────────────────────────────────────────

const memCache = new Map<string, CacheEntry>();
const MAX_MEM_ENTRIES = 500;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Cache key builder ──────────────────────────────────────────────────────

export function buildCacheKey(
  task: string,
  content: string,
  model?: string
): string {
  const raw = `${task}:${model ?? ''}:${content}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

// ── L1 memory cache ────────────────────────────────────────────────────────

export function getFromMemCache(key: string): CacheEntry | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > entry.ttlMs) {
    memCache.delete(key);
    return null;
  }
  entry.hitCount++;
  return entry;
}

export function setInMemCache(
  key: string,
  value: string,
  provider: ProviderId,
  model: string,
  ttlMs = DEFAULT_TTL_MS
): void {
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

export async function getFromFirestoreCache(key: string): Promise<CacheEntry | null> {
  try {
    const db = admin.firestore();
    const doc = await db.collection('ai_cache').doc(key).get();
    if (!doc.exists) return null;

    const entry = doc.data() as CacheEntry;
    if (Date.now() - entry.createdAt > entry.ttlMs) {
      // Expired — delete async
      doc.ref.delete().catch(() => {});
      return null;
    }

    // Promote to L1
    setInMemCache(key, entry.value, entry.provider, entry.model, entry.ttlMs);
    return entry;
  } catch (err) {
    console.warn('[Cache] Firestore read failed:', err);
    return null;
  }
}

export async function setInFirestoreCache(
  key: string,
  value: string,
  provider: ProviderId,
  model: string,
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  try {
    const db = admin.firestore();
    const entry: CacheEntry = {
      key,
      value,
      provider,
      model,
      createdAt: Date.now(),
      ttlMs,
      hitCount: 0,
    };
    await db.collection('ai_cache').doc(key).set(entry);
  } catch (err) {
    console.warn('[Cache] Firestore write failed:', err);
  }
}

// ── Unified cache lookup ───────────────────────────────────────────────────

export async function getCached(key: string): Promise<CacheEntry | null> {
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

export async function setCached(
  key: string,
  value: string,
  provider: ProviderId,
  model: string,
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  setInMemCache(key, value, provider, model, ttlMs);
  // Write to Firestore async (non-blocking)
  setInFirestoreCache(key, value, provider, model, ttlMs).catch(() => {});
}

// ── Cache stats ────────────────────────────────────────────────────────────

export function getMemCacheStats(): { size: number; entries: number } {
  return { size: memCache.size, entries: memCache.size };
}
