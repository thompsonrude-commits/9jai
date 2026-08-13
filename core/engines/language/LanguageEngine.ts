/**
 * LanguageEngine.ts
 *
 * Handles natural language understanding, language detection, and multilingual
 * text processing for the 9JA AI platform.
 */

import type { EngineOptions } from '../../utils/types';

export type AfricanLanguageCode =
  | 'edo'
  | 'yor'
  | 'ibo'
  | 'hau'
  | 'pcm'
  | 'ful'
  | 'twi'
  | 'swa'
  | 'zul'
  | 'amh';

export type SupportedLanguageCode = 'en' | 'fr' | 'ar' | 'pt' | 'es' | 'de' | 'zh' | 'ja' | 'ko' | AfricanLanguageCode;

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguageCode;
  confidence: number;
  alternatives: Array<{ language: SupportedLanguageCode; confidence: number }>;
  isAfricanLanguage: boolean;
  dialectHint?: string;
}

export interface NLPAnalysis {
  language: SupportedLanguageCode;
  sentiment?: 'positive' | 'neutral' | 'negative';
  entities?: Array<{ text: string; type: string; confidence: number }>;
  keywords?: string[];
  summary?: string;
  tokensUsed?: number;
}

export interface LanguageEngine {
  detectLanguage(text: string): Promise<LanguageDetectionResult>;
  analyze(text: string, options?: EngineOptions): Promise<NLPAnalysis>;
  generate(prompt: string, targetLanguage?: SupportedLanguageCode, options?: EngineOptions): Promise<string>;
  supportedLanguages(): SupportedLanguageCode[];
  supportsLanguage(code: SupportedLanguageCode): boolean;
}

const AFRICAN_LANGUAGE_HINTS: Record<string, SupportedLanguageCode> = {
  edo: 'edo',
  bini: 'edo',
  yoruba: 'yor',
  igbo: 'ibo',
  hausa: 'hau',
  pidgin: 'pcm',
  swahili: 'swa',
  zulu: 'zul',
  amharic: 'amh',
};

export class DefaultLanguageEngine implements LanguageEngine {
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const normalized = text.toLowerCase();
    const matchedKey = Object.keys(AFRICAN_LANGUAGE_HINTS).find((key) => normalized.includes(key));
    const detectedLanguage = (matchedKey ? AFRICAN_LANGUAGE_HINTS[matchedKey] : normalized.includes('ẹ') || normalized.includes('ọ') || normalized.includes('ì') ? 'edo' : 'en') as SupportedLanguageCode;
    const isAfricanLanguage = ['edo', 'yor', 'ibo', 'hau', 'pcm', 'ful', 'twi', 'swa', 'zul', 'amh'].includes(detectedLanguage);
    const confidence = detectedLanguage === 'en' ? 0.72 : 0.86;

    return {
      detectedLanguage,
      confidence,
      alternatives: [
        { language: detectedLanguage, confidence },
        { language: detectedLanguage === 'en' ? 'edo' : 'en', confidence: 0.5 },
      ],
      isAfricanLanguage,
      dialectHint: detectedLanguage === 'edo' ? 'Bini/Edo' : undefined,
    };
  }

  async analyze(text: string): Promise<NLPAnalysis> {
    const detection = await this.detectLanguage(text);
    const keywords = text.split(/\s+/).filter((word) => word.length > 3).slice(0, 6);
    return {
      language: detection.detectedLanguage,
      sentiment: text.includes('love') || text.includes('good') ? 'positive' : 'neutral',
      keywords,
      summary: `Analyzed ${text.length} characters in ${detection.detectedLanguage}`,
      tokensUsed: Math.min(64, Math.max(12, text.split(/\s+/).length)),
    };
  }

  async generate(prompt: string, targetLanguage: SupportedLanguageCode = 'en'): Promise<string> {
    const targetLabel = targetLanguage === 'yor' ? 'yoruba' : targetLanguage === 'edo' ? 'Edo' : targetLanguage;
    return `Generated response in ${targetLabel}: ${prompt}`;
  }

  supportedLanguages(): SupportedLanguageCode[] {
    return ['en', 'fr', 'ar', 'pt', 'es', 'de', 'zh', 'ja', 'ko', 'edo', 'yor', 'ibo', 'hau', 'pcm', 'swa', 'zul', 'amh'];
  }

  supportsLanguage(code: SupportedLanguageCode): boolean {
    return this.supportedLanguages().includes(code);
  }
}
