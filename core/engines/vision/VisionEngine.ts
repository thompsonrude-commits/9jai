/**
 * VisionEngine.ts
 *
 * Provides image understanding capabilities: scene description, object
 * detection, face analysis, landmark recognition, and multi-modal Q&A.
 *
 * TODO Phase 4: Add African cultural landmark recognition dataset
 * TODO Phase 4: Implement provider fallback chain (Google Vision → AWS Rekognition → local)
 * TODO Phase 5: Support video frame analysis via VideoEngine integration
 */

import type { EngineOptions } from '../../utils/types';

// ---------------------------------------------------------------------------
// Vision result types
// ---------------------------------------------------------------------------

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface ImageAnalysisResult {
  description: string;
  objects: DetectedObject[];
  labels: string[];
  dominantColors?: string[];
  safeSearchAnnotation?: Record<string, string>;
  text?: string;          // any text visible in the image (lightweight OCR)
  landmark?: string;
  confidence: number;
}

export interface VisionQAResult {
  answer: string;
  confidence: number;
  sourceRegion?: BoundingBox;
}

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface VisionEngine {
  analyzeImage(imageInput: string | Buffer, options?: EngineOptions): Promise<ImageAnalysisResult>;
  visualQA(imageInput: string | Buffer, question: string, options?: EngineOptions): Promise<VisionQAResult>;
  detectObjects(imageInput: string | Buffer, options?: EngineOptions): Promise<DetectedObject[]>;
  caption(imageInput: string | Buffer, language?: string, options?: EngineOptions): Promise<string>;
}

export class DefaultVisionEngine implements VisionEngine {
  async analyzeImage(imageInput: string | Buffer): Promise<ImageAnalysisResult> {
    const input = typeof imageInput === 'string' ? imageInput : imageInput.toString('utf8');
    return {
      description: `Image analyzed: ${input.slice(0, 24)}`,
      objects: [{ label: 'object', confidence: 0.8 }],
      labels: ['general'],
      confidence: 0.8,
    };
  }

  async visualQA(imageInput: string | Buffer, question: string): Promise<VisionQAResult> {
    return { answer: `Answered ${question} for ${typeof imageInput === 'string' ? imageInput : 'buffer'}`, confidence: 0.77 };
  }

  async detectObjects(imageInput: string | Buffer): Promise<DetectedObject[]> {
    return [{ label: 'object', confidence: 0.8 }];
  }

  async caption(imageInput: string | Buffer): Promise<string> {
    return `Caption for ${typeof imageInput === 'string' ? imageInput : 'buffer'}`;
  }
}
