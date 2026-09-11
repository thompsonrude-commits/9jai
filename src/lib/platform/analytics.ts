/**
 * Platform Analytics — Track usage patterns and performance metrics
 * Provides insights into user behavior, provider performance, and system health
 */

import { db, isFirebaseUnavailableError } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  type: 'chat' | 'vision' | 'image' | 'speech' | 'search' | 'translation';
  userId?: string;
  sessionId: string;
  provider: string;
  success: boolean;
  latencyMs: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  averageLatency: number;
  successRate: number;
  totalRequests: number;
  requestsByProvider: Record<string, number>;
  requestsByType: Record<string, number>;
  failureReasons: Record<string, number>;
}

export interface UsageStats {
  totalSessions: number;
  totalMessages: number;
  activeUsers: number;
  topLanguages: Array<{ language: string; count: number }>;
  topFeatures: Array<{ feature: string; count: number }>;
}

// ── Local Analytics Cache ──────────────────────────────────────────────────

class PlatformAnalytics {
  private eventBuffer: AnalyticsEvent[] = [];
  private readonly bufferSize = 50;
  private readonly flushInterval = 60000; // 1 minute
  private flushTimer?: number;

  constructor() {
    this.startAutoFlush();
    this.loadFromStorage();
  }

  // Track an event
  public trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.eventBuffer.push(fullEvent);
    this.saveToStorage();

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.bufferSize) {
      void this.flush();
    }
  }

  // Track a chat message
  public trackChat(
    provider: string,
    success: boolean,
    latencyMs: number,
    userId?: string,
    sessionId?: string
  ): void {
    this.trackEvent({
      type: 'chat',
      provider,
      success,
      latencyMs,
      userId,
      sessionId: sessionId ?? `session_${Date.now()}`,
    });
  }

  // Track vision request
  public trackVision(
    provider: string,
    success: boolean,
    latencyMs: number,
    userId?: string
  ): void {
    this.trackEvent({
      type: 'vision',
      provider,
      success,
      latencyMs,
      userId,
      sessionId: `vision_${Date.now()}`,
    });
  }

  // Track image generation
  public trackImageGen(
    provider: string,
    success: boolean,
    latencyMs: number,
    userId?: string
  ): void {
    this.trackEvent({
      type: 'image',
      provider,
      success,
      latencyMs,
      userId,
      sessionId: `image_${Date.now()}`,
    });
  }

  // Get local metrics (from buffer)
  public getLocalMetrics(): PerformanceMetrics {
    const totalRequests = this.eventBuffer.length;
    const successfulRequests = this.eventBuffer.filter(e => e.success).length;
    const totalLatency = this.eventBuffer.reduce((sum, e) => sum + e.latencyMs, 0);

    const requestsByProvider: Record<string, number> = {};
    const requestsByType: Record<string, number> = {};
    const failureReasons: Record<string, number> = {};

    this.eventBuffer.forEach(event => {
      // By provider
      requestsByProvider[event.provider] = (requestsByProvider[event.provider] || 0) + 1;

      // By type
      requestsByType[event.type] = (requestsByType[event.type] || 0) + 1;

      // Failure reasons (if metadata exists)
      if (!event.success && event.metadata?.error) {
        const reason = String(event.metadata.error);
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      }
    });

    return {
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 1,
      totalRequests,
      requestsByProvider,
      requestsByType,
      failureReasons,
    };
  }

  // Flush buffer to Firestore
  public async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];
    this.saveToStorage();

    try {
      const sanitizeEvent = (event: AnalyticsEvent) => {
        const cleaned: Record<string, unknown> = { ...event };
        Object.keys(cleaned).forEach(key => {
          if ((cleaned as Record<string, unknown>)[key] === undefined) delete (cleaned as Record<string, unknown>)[key];
        });
        return { ...cleaned, timestamp: Timestamp.fromMillis(event.timestamp) };
      };

      // Batch write to Firestore
      const promises = eventsToFlush.map(event =>
        addDoc(collection(db, 'analytics_events'), sanitizeEvent(event))
      );

      await Promise.all(promises);
      console.log(`[Analytics] Flushed ${eventsToFlush.length} events to Firestore`);
    } catch (err) {
      if (!isFirebaseUnavailableError(err)) {
        console.warn('[Analytics] Failed to flush events:', err);
      }
      // Re-add events to buffer on failure
      this.eventBuffer.unshift(...eventsToFlush);
      this.saveToStorage();
    }
  }

  // Get metrics from Firestore (last 24 hours)
  public async getFirestoreMetrics(): Promise<PerformanceMetrics> {
    try {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const q = query(
        collection(db, 'analytics_events'),
        where('timestamp', '>=', Timestamp.fromMillis(oneDayAgo)),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      const events: AnalyticsEvent[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        events.push({
          ...data,
          timestamp: data.timestamp.toMillis(),
        } as AnalyticsEvent);
      });

      // Calculate metrics
      const totalRequests = events.length;
      const successfulRequests = events.filter(e => e.success).length;
      const totalLatency = events.reduce((sum, e) => sum + e.latencyMs, 0);

      const requestsByProvider: Record<string, number> = {};
      const requestsByType: Record<string, number> = {};
      const failureReasons: Record<string, number> = {};

      events.forEach(event => {
        requestsByProvider[event.provider] = (requestsByProvider[event.provider] || 0) + 1;
        requestsByType[event.type] = (requestsByType[event.type] || 0) + 1;

        if (!event.success && event.metadata?.error) {
          const reason = String(event.metadata.error);
          failureReasons[reason] = (failureReasons[reason] || 0) + 1;
        }
      });

      return {
        averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
        successRate: totalRequests > 0 ? successfulRequests / totalRequests : 1,
        totalRequests,
        requestsByProvider,
        requestsByType,
        failureReasons,
      };
    } catch (err) {
      if (!isFirebaseUnavailableError(err)) {
        console.warn('[Analytics] Failed to fetch Firestore metrics:', err);
      }
      return this.getLocalMetrics();
    }
  }

  // Clear local buffer
  public clearBuffer(): void {
    this.eventBuffer = [];
    this.saveToStorage();
  }

  private startAutoFlush(): void {
    this.flushTimer = window.setInterval(() => {
      void this.flush();
    }, this.flushInterval);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('analytics_buffer', JSON.stringify(this.eventBuffer));
    } catch (err) {
      console.warn('[Analytics] Failed to save to storage:', err);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('analytics_buffer');
      if (stored) {
        this.eventBuffer = JSON.parse(stored);
      }
    } catch (err) {
      console.warn('[Analytics] Failed to load from storage:', err);
    }
  }

  // Cleanup on unmount
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    void this.flush();
  }
}

export const platformAnalytics = new PlatformAnalytics();

// Export helper functions
export function trackChatRequest(
  provider: string,
  success: boolean,
  latencyMs: number,
  userId?: string,
  sessionId?: string
): void {
  platformAnalytics.trackChat(provider, success, latencyMs, userId, sessionId);
}

export function trackVisionRequest(
  provider: string,
  success: boolean,
  latencyMs: number,
  userId?: string
): void {
  platformAnalytics.trackVision(provider, success, latencyMs, userId);
}

export function trackImageGeneration(
  provider: string,
  success: boolean,
  latencyMs: number,
  userId?: string
): void {
  platformAnalytics.trackImageGen(provider, success, latencyMs, userId);
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  return platformAnalytics.getFirestoreMetrics();
}

export async function flushAnalytics(): Promise<void> {
  return platformAnalytics.flush();
}
