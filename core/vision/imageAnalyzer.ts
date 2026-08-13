import { ImageInput, ImageAnalysisResult } from './types';

export class ImageAnalyzer {
  async analyze(image: ImageInput): Promise<ImageAnalysisResult> {
    const desc = `Structured description for image ${image.id || image.url || 'inline'}`;
    const objects = [
      { label: 'person', confidence: 0.9, bbox: { x: 10, y: 20, w: 80, h: 160 } },
      { label: 'phone', confidence: 0.7, bbox: { x: 50, y: 120, w: 30, h: 60 } },
    ];
    const scene = { indoor: true, environment: 'room', activity: 'holding', timeOfDay: 'day' };
    const metadata = { width: 800, height: 600, aspect: '4:3' };
    return { id: image.id, description: desc, objects: objects as any, scene, confidence: 0.8, metadata };
  }
}

export const defaultImageAnalyzer = new ImageAnalyzer();
