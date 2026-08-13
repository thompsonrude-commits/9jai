import { ImageInput } from './types';

export class MetadataGenerator {
  generate(image: ImageInput) {
    return {
      width: 800,
      height: 600,
      aspect: '4:3',
      orientation: 'landscape',
      colorProfile: 'sRGB',
      processedAt: Date.now(),
      source: image.url || 'inline',
    };
  }
}

export const defaultMetadataGenerator = new MetadataGenerator();
