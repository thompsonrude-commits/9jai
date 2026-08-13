/**
 * types.ts
 *
 * Shared TypeScript types used across all 9JA AI core engines, providers,
 * and services. Import from this file instead of defining duplicate types
 * in individual engine files.
 *
 * TODO Phase 2: Extend AIRequest with streaming flag and SSE support
 * TODO Phase 3: Add cost estimation fields to AIResponse
 */

// ---------------------------------------------------------------------------
// Language codes
// ---------------------------------------------------------------------------

/** Standard ISO 639-1 / 639-3 codes for globally common languages. */
export type LanguageCode =
  | 'en'   // English
  | 'fr'   // French
  | 'ar'   // Arabic
  | 'pt'   // Portuguese
  | 'es'   // Spanish
  | 'de'   // German
  | 'zh'   // Chinese
  | 'ja'   // Japanese
  | 'ko';  // Korean

// Re-exported from LanguageEngine for convenience
export type { SupportedLanguageCode } from '../engines/language/LanguageEngine';

// ---------------------------------------------------------------------------
// Engine types
// ---------------------------------------------------------------------------

export type EngineType =
  | 'language'
  | 'vision'
  | 'image'
  | 'video'
  | 'speech'
  | 'translation'
  | 'memory'
  | 'ocr';

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export type RequestType =
  | 'chat'
  | 'translate'
  | 'tts'
  | 'stt'
  | 'image-generate'
  | 'image-edit'
  | 'image-analyze'
  | 'video-generate'
  | 'ocr'
  | 'embed';

export interface AIRequest {
  type: RequestType;
  prompt?: string;
  input?: string | Buffer;      // binary input (image, audio, video, document)
  language?: string;
  targetLanguage?: string;
  sessionId?: string;
  userId?: string;
  requestId?: string;
  options?: Record<string, unknown>;
}

export interface AIResponse {
  requestId?: string;
  type: RequestType;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  base64?: string;
  mimeType?: string;
  detectedLanguage?: string;
  confidence?: number;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  error?: {
    code: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Engine options (common base for all per-engine option types)
// ---------------------------------------------------------------------------

export interface EngineOptions {
  timeout?: number;            // ms
  provider?: string;           // force a specific provider
  model?: string;              // force a specific model
  temperature?: number;        // 0–2
  maxTokens?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Provider config (re-exported for convenience)
// ---------------------------------------------------------------------------

export type { ProviderConfig } from '../config/AIConfig';

// ---------------------------------------------------------------------------
// Orchestrator config
// ---------------------------------------------------------------------------

export interface OrchestratorConfig {
  defaultProvider?: string;
  timeoutMs?: number;
  enableMemory?: boolean;
  enableLogging?: boolean;
}
