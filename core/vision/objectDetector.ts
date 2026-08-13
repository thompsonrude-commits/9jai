import { ImageInput, DetectedObject } from './types';

export class ObjectDetector {
  async detect(image: ImageInput): Promise<DetectedObject[]> {
    // lightweight deterministic detections for testing
    return [
      { id: 'o1', label: 'person', confidence: 0.95, bbox: { x: 12, y: 24, w: 60, h: 140 } },
      { id: 'o2', label: 'cup', confidence: 0.6, bbox: { x: 200, y: 150, w: 40, h: 60 } },
    ];
  }
}

export const defaultObjectDetector = new ObjectDetector();
