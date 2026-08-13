/**
 * ModelManager.ts
 *
 * Central registry for all AI models available to the 9JA AI platform.
 * Manages model metadata, capability declarations, and provider associations.
 * Supports dynamic model registration at runtime for hot-swapping.
 *
 * TODO Phase 2: Load model registry from remote config / database
 * TODO Phase 2: Add model version pinning and rollback support
 * TODO Phase 3: Implement model benchmarking score tracking
 */

import type { EngineType } from '../utils/types';

// ---------------------------------------------------------------------------
// Model descriptor
// ---------------------------------------------------------------------------

export type ModelCapability =
  | 'text-generation'
  | 'chat'
  | 'embeddings'
  | 'image-generation'
  | 'image-analysis'
  | 'video-generation'
  | 'tts'
  | 'stt'
  | 'translation'
  | 'ocr'
  | 'code';

export interface ModelDescriptor {
  id: string;                         // unique model identifier, e.g. "gpt-4o"
  name: string;                       // human-readable name
  provider: string;                   // provider ID, e.g. "openai"
  capabilities: ModelCapability[];
  contextWindowTokens?: number;
  inputCostPer1kTokens?: number;      // USD
  outputCostPer1kTokens?: number;     // USD
  supportedLanguages?: string[];      // ISO 639 codes
  africanLanguageSupport?: boolean;
  isDefault?: boolean;                // default for its capability set
  tags?: string[];
  deprecatedAt?: Date;
}

// ---------------------------------------------------------------------------
// Selection criteria
// ---------------------------------------------------------------------------

export interface ModelSelectionCriteria {
  capability: ModelCapability;
  language?: string;
  preferAfrican?: boolean;            // prefer models with African language support
  maxCostPer1kTokens?: number;
  provider?: string;                  // restrict to a specific provider
}

// ---------------------------------------------------------------------------
// ModelManager interface
// ---------------------------------------------------------------------------

export interface ModelManager {
  /**
   * Register a new model in the registry.
   */
  register(model: ModelDescriptor): void;

  /**
   * Deregister a model by ID.
   */
  unregister(modelId: string): void;

  /**
   * Retrieve a model by its ID.
   */
  get(modelId: string): ModelDescriptor | undefined;

  /**
   * Find the best model matching the given criteria.
   */
  select(criteria: ModelSelectionCriteria): ModelDescriptor | undefined;

  /**
   * List all models, optionally filtered by capability or engine type.
   */
  list(filters?: { capability?: ModelCapability; engineType?: EngineType }): ModelDescriptor[];

  /**
   * Return the default model for a given capability.
   */
  getDefault(capability: ModelCapability): ModelDescriptor | undefined;
}
