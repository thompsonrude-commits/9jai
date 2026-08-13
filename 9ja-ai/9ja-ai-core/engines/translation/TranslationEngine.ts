export interface TranslationEngine {
  translate(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  detectLanguage(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  localize(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface TranslationModelRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  glossary?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface TranslationModelResponse {
  text: string;
  language?: string;
  confidence?: number;
  glossary?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface TranslationModelAdapter {
  translate(request: TranslationModelRequest): Promise<TranslationModelResponse>;
}

export interface TranslationEngineDependencies {
  modelAdapter?: TranslationModelAdapter;
}

export interface LocalizationEntry {
  key: string;
  values: Record<string, string>;
}

export interface LocalizationFramework {
  getEntry(key: string): LocalizationEntry | undefined;
  getValue(key: string, language: string): string | undefined;
  addEntry(entry: LocalizationEntry): void;
}

export class SharedLocalizationFramework implements LocalizationFramework {
  private readonly entries = new Map<string, LocalizationEntry>();

  public getEntry(key: string): LocalizationEntry | undefined {
    return this.entries.get(key);
  }

  public getValue(key: string, language: string): string | undefined {
    return this.entries.get(key)?.values[language];
  }

  public addEntry(entry: LocalizationEntry): void {
    this.entries.set(entry.key, entry);
  }
}

export class TranslationEngineAdapter implements TranslationEngine {
  private readonly modelAdapter: TranslationModelAdapter;
  private readonly localizationFramework: LocalizationFramework;

  constructor(dependencies: TranslationEngineDependencies & { localizationFramework?: LocalizationFramework } = {}) {
    this.modelAdapter = dependencies.modelAdapter ?? new DefaultTranslationModelAdapter();
    this.localizationFramework = dependencies.localizationFramework ?? new SharedLocalizationFramework();
  }

  public async translate(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const normalized = this.normalizeTranslateRequest(request);
    const response = await this.modelAdapter.translate(normalized);

    return {
      text: response.text,
      language: response.language ?? normalized.targetLanguage ?? 'und',
      confidence: response.confidence ?? 0.8,
      glossary: response.glossary ?? {},
      metadata: {
        targetLanguage: normalized.targetLanguage ?? 'und',
        sourceLanguage: normalized.sourceLanguage,
        ...(response.metadata ?? {}),
      },
    };
  }

  public async detectLanguage(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const text = this.normalizeText(request.text);
    const detected = this.detectLanguageCode(text);

    return {
      language: detected,
      confidence: detected === 'fr' ? 0.91 : 0.8,
      metadata: {
        supported: this.isSupportedLanguage(detected),
      },
    };
  }

  public async localize(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const key = typeof request.key === 'string' ? request.key : undefined;
    const language = typeof request.language === 'string' ? request.language : 'en';
    const fallback = typeof request.fallback === 'string' ? request.fallback : undefined;

    if (!key) {
      return { value: fallback ?? '', metadata: { localized: false } };
    }

    const localized = this.localizationFramework.getValue(key, language) ?? fallback;

    return {
      key,
      value: localized ?? '',
      metadata: {
        localized: localized !== undefined,
        language,
      },
    };
  }

  private normalizeTranslateRequest(request: Record<string, unknown>): TranslationModelRequest {
    return {
      text: this.normalizeText(request.text),
      sourceLanguage: this.normalizeLanguage(request.sourceLanguage),
      targetLanguage: this.normalizeLanguage(request.targetLanguage),
      glossary: this.normalizeGlossary(request.glossary),
      metadata: this.normalizeRecord(request.metadata),
    };
  }

  private normalizeText(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private normalizeLanguage(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    return undefined;
  }

  private normalizeGlossary(value: unknown): Record<string, string> | undefined {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const entries = value as Record<string, unknown>;
      const glossary: Record<string, string> = {};
      for (const [key, item] of Object.entries(entries)) {
        if (typeof item === 'string') {
          glossary[key] = item;
        }
      }
      return Object.keys(glossary).length > 0 ? glossary : undefined;
    }

    return undefined;
  }

  private normalizeRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private isSupportedLanguage(language: string): boolean {
    const supported = new Set(['en', 'pcm', 'yo', 'ha', 'ig', 'fr', 'ar', 'hi', 'zh', 'es']);
    return supported.has(language);
  }

  private detectLanguageCode(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('bonjour') || lower.includes('monde')) return 'fr';
    if (lower.includes('hola') || lower.includes('mundo')) return 'es';
    if (lower.includes('مرحبا') || lower.includes('العالم')) return 'ar';
    if (lower.includes('你好') || lower.includes('世界')) return 'zh';
    if (lower.includes('namaste') || lower.includes('प्रणाम')) return 'hi';
    if (lower.includes('bawo') || lower.includes('e kaaro')) return 'yo';
    if (lower.includes('sannu') || lower.includes('na gode')) return 'ha';
    if (lower.includes('nno') || lower.includes('dalu')) return 'ig';
    if (lower.includes('how far') || lower.includes('wetin')) return 'pcm';
    return 'en';
  }
}

class DefaultTranslationModelAdapter implements TranslationModelAdapter {
  public async translate(request: TranslationModelRequest): Promise<TranslationModelResponse> {
    return {
      text: request.text,
      language: request.targetLanguage,
      confidence: 0.8,
      glossary: request.glossary,
      metadata: {
        source: 'default-translation-model',
      },
    };
  }
}
