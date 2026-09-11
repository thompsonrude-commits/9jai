import { generateImage as generateImage, buildFinalImagePrompt } from './imageClient';

export interface ImageEngineResult {
  prompt: string;
  imageUrl: string;
  provider: 'local';
  model: '9jai-local';
  latencyMs: number;
}

export class ImageEngine {
  async generateImage(prompt: string): Promise<ImageEngineResult> {
    const trimmed = (prompt || '').trim() || '9JAI concept illustration';
    const reactImage = await generateImage(trimmed);
    return {
      prompt: trimmed,
      imageUrl: reactImage.imageUrl,
      provider: 'local',
      model: '9jai-local',
      latencyMs: 0,
    };
  }

  buildPrompt(rawPrompt: string): string {
    return buildFinalImagePrompt(rawPrompt || 'concept illustration');
  }
}

export const defaultImageEngine = new ImageEngine();

export async function generateImageFromPrompt(prompt: string): Promise<ImageEngineResult> {
  return defaultImageEngine.generateImage(prompt);
}
