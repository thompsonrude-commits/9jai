import { ImageInput } from './types';

export class ImageClassifier {
  async classify(image: ImageInput, categories: string[] = []) {
    // return a small set of categories with confidence
    const defaults = ['food', 'electronics', 'vehicle', 'building', 'nature'];
    const cats = categories.length ? categories : defaults;
    return cats.map((c, i) => ({ category: c, confidence: 1 / (i + 1) }));
  }
}

export const defaultImageClassifier = new ImageClassifier();
