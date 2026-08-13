/**
 * OCREngine.ts
 *
 * Optical Character Recognition engine. Extracts text from images,
 * scanned documents, and PDFs. Includes support for African-language scripts
 * and historical Edo/Benin manuscript digitisation.
 *
 * TODO Phase 4: Integrate Google Document AI and AWS Textract providers
 * TODO Phase 4: Add Edo/Bini script character recognition dataset
 * TODO Phase 5: Support structured document extraction (tables, forms)
 */

import type { EngineOptions } from '../../utils/types';

// ---------------------------------------------------------------------------
// OCR result types
// ---------------------------------------------------------------------------

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  language?: string;        // detected language of this block
  pageNumber?: number;
}

export interface OCRResult {
  fullText: string;
  blocks: TextBlock[];
  detectedLanguages: string[];
  pageCount?: number;
  hasTabularData?: boolean;
  confidence: number;
  provider: string;
}

export interface StructuredDocumentResult extends OCRResult {
  tables?: Array<{
    rows: string[][];
    pageNumber: number;
  }>;
  keyValuePairs?: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
}

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface OCREngine {
  extractText(imageInput: string | Buffer, options?: EngineOptions): Promise<OCRResult>;
  extractFromDocument(documentInput: string | Buffer, options?: EngineOptions): Promise<OCRResult>;
  extractStructured(documentInput: string | Buffer, options?: EngineOptions): Promise<StructuredDocumentResult>;
  supportedLanguages(): string[];
}

export class DefaultOcrEngine implements OCREngine {
  async extractText(imageInput: string | Buffer): Promise<OCRResult> {
    const text = typeof imageInput === 'string' ? imageInput : imageInput.toString('utf8');
    return {
      fullText: text,
      blocks: [{ text, confidence: 0.9, language: 'en' }],
      detectedLanguages: ['en'],
      confidence: 0.9,
      provider: 'local-ocr',
    };
  }

  async extractFromDocument(documentInput: string | Buffer): Promise<OCRResult> {
    return this.extractText(documentInput);
  }

  async extractStructured(documentInput: string | Buffer): Promise<StructuredDocumentResult> {
    const result = await this.extractText(documentInput);
    return { ...result, tables: [], keyValuePairs: [] };
  }

  supportedLanguages(): string[] {
    return ['en', 'edo', 'yo', 'ig'];
  }
}
