export type OcrInputType = 'image' | 'pdf' | 'scanned' | 'screenshot' | 'camera';

export interface OcrRequest {
  id?: string;
  inputType: OcrInputType;
  data: any; // could be buffer, path, base64
  pages?: number;
  options?: Record<string, any>;
}

export interface OcrTextSpan {
  text: string;
  confidence: number;
  bbox?: [number, number, number, number];
}

export interface OcrLine {
  spans: OcrTextSpan[];
  lineConfidence: number;
}

export interface OcrBlock {
  id: string;
  type: 'paragraph' | 'title' | 'table' | 'list' | 'header' | 'footer' | 'unknown';
  lines: OcrLine[];
  confidence: number;
}

export interface OcrPage {
  pageNumber: number;
  width?: number;
  height?: number;
  rotation?: number;
  blocks: OcrBlock[];
}

export interface OcrResult {
  id?: string;
  pages: OcrPage[];
  rawText?: string;
  language?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface OcrEngineOptions {
  id?: string;
  name?: string;
}
