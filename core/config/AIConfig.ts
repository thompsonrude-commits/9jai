/**
 * AIConfig.ts
 *
 * Centralised configuration types and sensible defaults for the 9JA AI
 * platform. Configuration is loaded from environment variables or a config
 * file at startup and validated before engines are initialised.
 *
 * TODO Phase 2: Add Zod schema validation for all config shapes
 * TODO Phase 2: Support runtime config reload without restart
 * TODO Phase 3: Add per-provider cost budgets and hard limits
 */

import type { SupportedLanguageCode } from '../engines/language/LanguageEngine';

// ---------------------------------------------------------------------------
// Provider-level config
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;           // ms — default 30 000
  maxRetries?: number;        // default 3
  enabled?: boolean;
  [key: string]: unknown;     // provider-specific extensions
}

export interface ProvidersConfig {
  openai?: ProviderConfig;
  anthropic?: ProviderConfig;
  google?: ProviderConfig;
  elevenlabs?: ProviderConfig;
  stability?: ProviderConfig;
  deepl?: ProviderConfig;
  runway?: ProviderConfig;
  local?: ProviderConfig;     // local/self-hosted model endpoint
  [providerId: string]: ProviderConfig | undefined;
}

// ---------------------------------------------------------------------------
// Engine-level config
// ---------------------------------------------------------------------------

export interface LanguageEngineConfig {
  defaultLanguage: SupportedLanguageCode;
  fallbackLanguage: SupportedLanguageCode;
  preferAfricanModels: boolean;
}

export interface SpeechEngineConfig {
  defaultVoice?: string;
  outputFormat?: 'mp3' | 'wav' | 'ogg';
  defaultLanguage?: SupportedLanguageCode;
}

export interface MemoryEngineConfig {
  maxSessionTokens?: number;      // default 8 000
  longTermEnabled?: boolean;
  vectorStoreUrl?: string;
}

export interface EnginesConfig {
  language?: Partial<LanguageEngineConfig>;
  speech?: Partial<SpeechEngineConfig>;
  memory?: Partial<MemoryEngineConfig>;
}

// ---------------------------------------------------------------------------
// Top-level AI config
// ---------------------------------------------------------------------------

export interface AIConfig {
  environment: 'development' | 'staging' | 'production';
  providers: ProvidersConfig;
  engines?: EnginesConfig;
  defaultProvider?: string;       // provider ID used when none is specified
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableTelemetry?: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_AI_CONFIG: Partial<AIConfig> = {
  environment: 'development',
  providers: {},
  engines: {
    language: {
      defaultLanguage: 'edo',
      fallbackLanguage: 'en',
      preferAfricanModels: true,
    },
    speech: {
      outputFormat: 'mp3',
    },
    memory: {
      maxSessionTokens: 8000,
      longTermEnabled: false,
    },
  },
  logLevel: 'info',
  enableTelemetry: false,
};
