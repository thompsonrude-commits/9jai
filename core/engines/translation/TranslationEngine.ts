/**
 * TranslationEngine.ts
 *
 * Cross-language translation engine with special support for Nigerian and
 * African languages that lack coverage in standard translation APIs.
 * Includes glossary/terminology management for domain-specific accuracy.
 *
 * TODO Phase 2: Build custom Edo ↔ English translation dataset
 * TODO Phase 2: Integrate DeepL, Google Translate, and NLLB-200 providers
 * TODO Phase 3: Add glossary-aware translation for cultural terms
 */

import type { EngineOptions } from '../../utils/types';
import type { SupportedLanguageCode } from '../language/LanguageEngine';

// ---------------------------------------------------------------------------
// Translation types
// ---------------------------------------------------------------------------

export interface TranslationOptions extends EngineOptions {
  formality?: 'formal' | 'informal';
  glossaryId?: string;          // ID of a custom glossary to apply
  preserveFormatting?: boolean; // keep markdown, HTML tags, etc.
  provider?: string;            // override preferred provider
  domain?: string;              // e.g. "medical", "legal", "cultural"
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguageCode;
  targetLanguage: SupportedLanguageCode;
  confidence: number;
  provider: string;
  alternativeTranslations?: string[];
  glossaryTermsUsed?: string[];
}

// ---------------------------------------------------------------------------
// Glossary management
// ---------------------------------------------------------------------------

export interface GlossaryEntry {
  source: string;
  target: string;
  notes?: string;             // e.g. "used in traditional Edo context"
}

export interface Glossary {
  id: string;
  name: string;
  sourceLang: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  entries: GlossaryEntry[];
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface TranslationEngine {
  translate(
    text: string,
    targetLanguage: SupportedLanguageCode,
    sourceLanguage?: SupportedLanguageCode,
    options?: TranslationOptions
  ): Promise<TranslationResult>;

  translateBatch(
    texts: string[],
    targetLanguage: SupportedLanguageCode,
    sourceLanguage?: SupportedLanguageCode,
    options?: TranslationOptions
  ): Promise<TranslationResult[]>;

  createGlossary(
    name: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    entries: GlossaryEntry[]
  ): Promise<Glossary>;

  supportedPairs(): Array<{ source: SupportedLanguageCode; target: SupportedLanguageCode }>;
}

export class DefaultTranslationEngine implements TranslationEngine {
  async translate(text: string, targetLanguage: SupportedLanguageCode, sourceLanguage: SupportedLanguageCode = 'en'): Promise<TranslationResult> {
    const translatedText = `${text} -> ${targetLanguage}`;
    return {
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.82,
      provider: 'local-rule-based',
      alternativeTranslations: [`${text} (${targetLanguage})`],
    };
  }

  async translateBatch(texts: string[], targetLanguage: SupportedLanguageCode, sourceLanguage?: SupportedLanguageCode): Promise<TranslationResult[]> {
    return Promise.all(texts.map((text) => this.translate(text, targetLanguage, sourceLanguage)));
  }

  async createGlossary(name: string, sourceLang: SupportedLanguageCode, targetLang: SupportedLanguageCode, entries: GlossaryEntry[]): Promise<Glossary> {
    return { id: `glossary-${name}`, name, sourceLang, targetLang, entries, createdAt: new Date() };
  }

  supportedPairs(): Array<{ source: SupportedLanguageCode; target: SupportedLanguageCode }> {
    return [
      { source: 'en', target: 'yo' as SupportedLanguageCode },
      { source: 'en', target: 'edo' as SupportedLanguageCode },
      { source: 'en', target: 'fr' as SupportedLanguageCode },
    ];
  }
}
