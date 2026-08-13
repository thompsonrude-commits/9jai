import { ImageInput } from './types';

export class ImageComparator {
  async compare(images: ImageInput[]) {
    // simple similarity metric based on url/text length
    const base = images.map(i => (i.url || i.id || '').toString().length);
    const max = Math.max(...base, 1);
    const similarities = images.map((i, idx) => ({ index: idx, score: base[idx] / max }));
    return { similarities, differences: [] };
  }
}

export const defaultImageComparator = new ImageComparator();
