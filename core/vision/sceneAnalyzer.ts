import { ImageInput, SceneMetadata } from './types';

export class SceneAnalyzer {
  async analyze(image: ImageInput): Promise<SceneMetadata> {
    // naive heuristics for demo
    return { indoor: true, environment: 'indoor', activity: 'conversation', weather: 'unknown', timeOfDay: 'day' };
  }
}

export const defaultSceneAnalyzer = new SceneAnalyzer();
