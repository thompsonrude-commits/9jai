/**
 * Shared types for the 9jai AI proxy layer
 */

// ── Provider identifiers ───────────────────────────────────────────────────

export type ProviderId =
  | 'openrouter'
  | 'groq'
  | 'together'
  | 'huggingface'
  | 'deepseek'
  | 'mistral'
  | 'ollama'
  | 'pollinations';

export type TaskType =
  | 'chat'
  | 'stream'
  | 'embed'
  | 'image'
  | 'transcribe'
  | 'search';

// ── Request / Response shapes ──────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  task: TaskType;
  messages?: ChatMessage[];
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  preferredProviders?: ProviderId[];
  sessionId?: string;
  userId?: string;
}

export interface AIResponse {
  text: string;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  cached: boolean;
  tokensUsed?: number;
  error?: string;
}

// ── Provider health ────────────────────────────────────────────────────────

export type ProviderStatus = 'healthy' | 'degraded' | 'down';

export interface ProviderHealth {
  providerId: ProviderId;
  status: ProviderStatus;
  lastChecked: number;
  avgLatencyMs: number;
  successRate: number;   // 0–1
  consecutiveFailures: number;
  lastError?: string;
}

// ── Routing decision ───────────────────────────────────────────────────────

export interface RoutingDecision {
  selectedProvider: ProviderId;
  selectedModel: string;
  reason: string;
  fallbackChain: ProviderId[];
  estimatedLatencyMs: number;
}

// ── Logging ────────────────────────────────────────────────────────────────

export interface RequestLog {
  requestId: string;
  userId?: string;
  sessionId?: string;
  task: TaskType;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  cached: boolean;
  success: boolean;
  error?: string;
  timestamp: number;
  region?: string;
}

// ── Cache entry ────────────────────────────────────────────────────────────

export interface CacheEntry {
  key: string;
  value: string;
  provider: ProviderId;
  model: string;
  createdAt: number;
  ttlMs: number;
  hitCount: number;
}
