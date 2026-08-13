export type NlieInputType = 'text' | 'speech' | 'multimodal';

export interface NlieRequest {
  id?: string;
  inputType: NlieInputType;
  text?: string;
  metadata?: Record<string, any>;
}

export interface LanguageDetectionResult {
  language: string; // e.g., 'en', 'pcm' (pidgin), 'yo', 'ig', 'ha'
  dialect?: string | null;
  confidence: number;
  isCodeSwitched?: boolean;
  segments?: Array<{ text: string; language: string; confidence: number }>;
}

export interface TranslationResult {
  sourceLanguage: string;
  targetLanguage: string;
  translatedText: string;
  confidence: number;
}

export interface NlieResult {
  id?: string;
  detection?: LanguageDetectionResult;
  translations?: TranslationResult[];
  interpretation?: string; // short interpretation preserving cultural meaning
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface NlieEngineOptions {
  id?: string;
  name?: string;
}
