import { VisionEngineAdapter } from '../vision/VisionEngine';

export interface OCREngineResult {
  operation?: OCRModelRequest['operation'];
  text?: string;
  language?: string;
  structured?: OCRStructuredOutput;
  confidence?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OCREngine {
  extractPrintedText(request: Record<string, unknown>): Promise<OCREngineResult>;
  extractHandwriting(request: Record<string, unknown>): Promise<OCREngineResult>;
  parseReceipt(request: Record<string, unknown>): Promise<OCREngineResult>;
  parseTable(request: Record<string, unknown>): Promise<OCREngineResult>;
  parseForm(request: Record<string, unknown>): Promise<OCREngineResult>;
  parsePdf(request: Record<string, unknown>): Promise<OCREngineResult>;
}

export interface OCRBlock {
  type: 'paragraph' | 'table' | 'field' | 'line' | 'receipt' | 'page';
  text?: string;
  value?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface OCRStructuredOutput {
  blocks: OCRBlock[];
  tables?: Array<Record<string, string>>;
  fields?: Record<string, string>;
}

export interface OCRModelRequest {
  operation: 'printed' | 'handwriting' | 'receipt' | 'table' | 'form' | 'pdf';
  image?: unknown;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface OCRModelResponse {
  text?: string;
  language?: string;
  structured?: OCRStructuredOutput;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface OCRModelAdapter {
  extract(request: OCRModelRequest): Promise<OCRModelResponse>;
}

export interface OCREngineDependencies {
  modelAdapter?: OCRModelAdapter;
  visionEngine?: VisionEngineAdapter;
}

export class OCREngineAdapter implements OCREngine {
  private readonly modelAdapter: OCRModelAdapter;
  private readonly visionEngine?: VisionEngineAdapter;

  constructor(dependencies: OCREngineDependencies = {}) {
    this.modelAdapter = dependencies.modelAdapter ?? new DefaultOCRModelAdapter();
    this.visionEngine = dependencies.visionEngine;
  }

  public async extractPrintedText(request: Record<string, unknown>): Promise<OCREngineResult> {
    return this.execute('printed', request);
  }

  public async extractHandwriting(request: Record<string, unknown>): Promise<OCREngineResult> {
    return this.execute('handwriting', request);
  }

  public async parseReceipt(request: Record<string, unknown>): Promise<OCREngineResult> {
    const response = await this.execute('receipt', request);
    return {
      ...response,
      metadata: {
        ...this.normalizeRecord(response.metadata),
        documentType: 'receipt',
      },
    };
  }

  public async parseTable(request: Record<string, unknown>): Promise<OCREngineResult> {
    return this.execute('table', request);
  }

  public async parseForm(request: Record<string, unknown>): Promise<OCREngineResult> {
    return this.execute('form', request);
  }

  public async parsePdf(request: Record<string, unknown>): Promise<OCREngineResult> {
    const response = await this.execute('pdf', request);
    return {
      ...response,
      metadata: {
        ...this.normalizeRecord(response.metadata),
        documentType: 'pdf',
      },
    };
  }

  private async execute(operation: OCRModelRequest['operation'], request: Record<string, unknown>): Promise<OCREngineResult> {
    const language = this.normalizeLanguage(request.language);

    const visionContext = this.visionEngine
      ? await this.visionEngine.understandImage({ image: request.image, prompt: 'Support OCR extraction' })
      : undefined;

    const modelRequest: OCRModelRequest = {
      operation,
      image: request.image,
      language,
      metadata: {
        ...(this.normalizeRecord(request.metadata)),
        ...(visionContext ? { visionContext } : {}),
      },
    };

    const response = await this.modelAdapter.extract(modelRequest);

    return {
      operation,
      text: response.text ?? '',
      language: response.language ?? language,
      structured: response.structured ?? { blocks: [] },
      confidence: response.confidence ?? 0.8,
      metadata: {
        ...(response.metadata ?? {}),
        ...(modelRequest.metadata ?? {}),
      },
    };
  }

  private normalizeLanguage(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    return 'und';
  }

  private normalizeRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

class DefaultOCRModelAdapter implements OCRModelAdapter {
  public async extract(request: OCRModelRequest): Promise<OCRModelResponse> {
    return {
      text: 'OCR placeholder text',
      language: request.language ?? 'und',
      structured: {
        blocks: [
          { type: 'paragraph', text: 'OCR placeholder text' },
        ],
      },
      confidence: 0.8,
      metadata: {
        source: 'default-ocr-model',
      },
    };
  }
}
