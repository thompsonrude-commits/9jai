/**
 * Recovery Service — Queue management and automatic retry logic
 * Handles failed requests, maintains request queue, and retries when providers recover
 */

import { providerRegistry } from './providerRegistry';

export interface QueuedRequest {
  id: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  capability: string;
  createdAt: number;
  retryCount?: number;
  lastRetry?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface RecoveryService {
  setRetryHandler(handler: (request: QueuedRequest) => Promise<boolean>): void;
  recordSuccess(provider: string, latencyMs: number, confidence: number, capability: string): void;
  recordFailure(provider: string, reason: string, capability: string): void;
  evaluateOfflineMode(capability: string): void;
  enqueueRequest(request: QueuedRequest): void;
  getQueueStatus(): QueueStatus;
  clearQueue(): void;
  retryAll(): Promise<void>;
}

export interface QueueStatus {
  queueLength: number;
  oldestRequest?: number;
  pendingByCapability: Record<string, number>;
  totalRetries: number;
}

class DefaultRecoveryService implements RecoveryService {
  private retryHandler?: (request: QueuedRequest) => Promise<boolean>;
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private maxQueueSize = 100;
  private maxRetries = 3;
  private retryDelayMs = 30000; // 30 seconds
  private totalRetries = 0;

  constructor() {
    // Start background queue processor
    this.startQueueProcessor();
    // Load queue from localStorage on init
    this.loadQueueFromStorage();
  }

  setRetryHandler(handler: (request: QueuedRequest) => Promise<boolean>): void {
    this.retryHandler = handler;
  }

  recordSuccess(provider: string, latencyMs: number, _confidence: number, _capability: string): void {
    providerRegistry.recordSuccess(provider, latencyMs);
  }

  recordFailure(provider: string, reason: string, _capability: string): void {
    providerRegistry.recordFailure(provider, reason);
  }

  evaluateOfflineMode(_capability: string): void {
    // Offline mode is now managed by providerRegistry
    const diagnostics = providerRegistry.getDiagnostics('chat');
    
    // If we have active providers and queued requests, try processing
    if (diagnostics.activeProviders.length > 0 && this.queue.length > 0 && !this.isProcessing) {
      void this.processQueue();
    }
  }

  enqueueRequest(request: QueuedRequest): void {
    // Prevent queue overflow
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('[Recovery] Queue full, dropping oldest request');
      this.queue.shift();
    }

    // Check for duplicates
    const isDuplicate = this.queue.some(r => 
      r.id === request.id || 
      (r.capability === request.capability && 
       JSON.stringify(r.messages) === JSON.stringify(request.messages))
    );

    if (isDuplicate) {
      console.log('[Recovery] Skipping duplicate request');
      return;
    }

    this.queue.push({
      ...request,
      retryCount: request.retryCount ?? 0,
      priority: request.priority ?? 'normal',
    });

    this.saveQueueToStorage();
    console.log(`[Recovery] Request queued: ${request.id} (queue length: ${this.queue.length})`);

    // Attempt immediate processing if not already processing
    if (!this.isProcessing) {
      void this.processQueue();
    }
  }

  getQueueStatus(): QueueStatus {
    const pendingByCapability: Record<string, number> = {};
    
    this.queue.forEach(req => {
      pendingByCapability[req.capability] = (pendingByCapability[req.capability] || 0) + 1;
    });

    return {
      queueLength: this.queue.length,
      oldestRequest: this.queue.length > 0 ? this.queue[0].createdAt : undefined,
      pendingByCapability,
      totalRetries: this.totalRetries,
    };
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueueToStorage();
    console.log('[Recovery] Queue cleared');
  }

  async retryAll(): Promise<void> {
    if (this.isProcessing) {
      console.log('[Recovery] Already processing queue');
      return;
    }

    console.log(`[Recovery] Manual retry triggered for ${this.queue.length} requests`);
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.retryHandler) {
      return;
    }

    this.isProcessing = true;

    try {
      // Sort by priority (high > normal > low) then by age (oldest first)
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      this.queue.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority ?? 'normal'] - priorityOrder[b.priority ?? 'normal'];
        return priorityDiff !== 0 ? priorityDiff : a.createdAt - b.createdAt;
      });

      const batch = this.queue.slice(0, 5); // Process up to 5 at a time

      for (const request of batch) {
        // Check if provider is available
        const provider = providerRegistry.selectProvider(request.capability);
        if (!provider) {
          console.log(`[Recovery] No provider available for ${request.capability}`);
          continue;
        }

        // Check retry limits
        if ((request.retryCount ?? 0) >= this.maxRetries) {
          console.warn(`[Recovery] Max retries reached for ${request.id}, dropping`);
          this.removeFromQueue(request.id);
          continue;
        }

        // Check retry delay
        const timeSinceLastRetry = Date.now() - (request.lastRetry ?? request.createdAt);
        if (timeSinceLastRetry < this.retryDelayMs) {
          continue; // Skip, too soon
        }

        // Attempt retry
        console.log(`[Recovery] Retrying request ${request.id} (attempt ${(request.retryCount ?? 0) + 1}/${this.maxRetries})`);
        
        try {
          const success = await this.retryHandler(request);
          
          if (success) {
            console.log(`[Recovery] Request ${request.id} succeeded`);
            this.removeFromQueue(request.id);
          } else {
            console.log(`[Recovery] Request ${request.id} failed, will retry`);
            request.retryCount = (request.retryCount ?? 0) + 1;
            request.lastRetry = Date.now();
            this.totalRetries++;
          }
        } catch (err) {
          console.warn(`[Recovery] Retry error for ${request.id}:`, err);
          request.retryCount = (request.retryCount ?? 0) + 1;
          request.lastRetry = Date.now();
          this.totalRetries++;
        }

        // Small delay between retries
        await this.delay(500);
      }

      this.saveQueueToStorage();
    } finally {
      this.isProcessing = false;
    }
  }

  private removeFromQueue(requestId: string): void {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(r => r.id !== requestId);
    if (this.queue.length < initialLength) {
      this.saveQueueToStorage();
    }
  }

  private startQueueProcessor(): void {
    // Check queue every minute
    setInterval(() => {
      if (this.queue.length > 0 && !this.isProcessing) {
        void this.processQueue();
      }
    }, 60 * 1000);
  }

  private saveQueueToStorage(): void {
    try {
      localStorage.setItem('recovery_queue', JSON.stringify(this.queue));
    } catch (err) {
      console.warn('[Recovery] Failed to save queue to storage:', err);
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem('recovery_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[Recovery] Loaded ${this.queue.length} requests from storage`);
        
        // Clean up old requests (older than 24 hours)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.queue = this.queue.filter(r => r.createdAt > oneDayAgo);
        
        if (this.queue.length > 0) {
          this.saveQueueToStorage();
        }
      }
    } catch (err) {
      console.warn('[Recovery] Failed to load queue from storage:', err);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const recoveryService: RecoveryService = new DefaultRecoveryService();
export type { QueuedRequest as ProxyChatMessage };
