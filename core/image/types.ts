export type ImageInputType = 'text' | 'image' | 'multi';

export interface GenerateRequest {
  id?: string;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  width?: number;
  height?: number;
  options?: Record<string, any>;
}

export interface EditRequest {
  id?: string;
  image: any; // buffer or path
  prompt?: string;
  mask?: any; // optional mask for inpainting
  options?: Record<string, any>;
}

export interface AnalyzeRequest {
  id?: string;
  image: any;
  options?: Record<string, any>;
}

export interface ImageResult {
  id?: string;
  images?: any[]; // buffers or URLs
  metadata?: Record<string, any>;
  warnings?: string[];
}

export interface ImageEngineOptions {
  id?: string;
  name?: string;
}
