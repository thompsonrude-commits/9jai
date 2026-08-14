import { DEFAULT_MAX_INLINE_IMAGE_BYTES, normalizeImageForVision } from './imageNormalization';

export interface OcrResult {
  text: string;
  confidence?: number;
  provider?: string;
  language?: string;
  source?: 'tesseract' | 'api' | 'local';
}

async function preprocessImageForOcr(imageUrl: string): Promise<string> {
  const normalizedImage = await normalizeImageForVision(imageUrl, {
    maxDimension: 1600,
    maxBytes: DEFAULT_MAX_INLINE_IMAGE_BYTES,
    quality: 0.9,
  });

  if (typeof document === 'undefined') return normalizedImage.dataUrl;

  const img = new Image();
  img.src = normalizedImage.dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = () => resolve(null);
    img.onerror = () => reject(new Error('Image could not be loaded for OCR preprocessing.'));
  });

  const canvas = document.createElement('canvas');
  const ratio = Math.min(1.6, 1600 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * ratio));
  canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) return normalizedImage.dataUrl;

  ctx.filter = 'contrast(1.25) saturate(1.2) brightness(1.05)';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const threshold = gray > 180 ? 255 : 0;
    data[i] = threshold;
    data[i + 1] = threshold;
    data[i + 2] = threshold;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

async function tryTesseractOcr(preprocessedImage: string): Promise<OcrResult | null> {
  try {
    const tesseractModule = await (Function('return import("tesseract.js")')() as Promise<any>);
    const Module = tesseractModule?.default || tesseractModule;
    const result = await Module?.recognize?.(preprocessedImage, 'eng', { logger: () => {} });
    const text = (result?.data?.text || '').trim();
    if (text) {
      return {
        text,
        confidence: result?.data?.confidence,
        provider: 'tesseract',
        source: 'tesseract',
      };
    }
  } catch {
    // ignore if Tesseract is unavailable in this environment and continue to local fallback paths
  }
  return null;
}

async function tryApiOcr(preprocessedImage: string): Promise<OcrResult | null> {
  try {
    const response = await fetch('/api/v1/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: preprocessedImage, language: 'eng', layout: true }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return null;
    const payload = await response.json().catch(() => ({})) as {
      data?: { text?: string; confidence?: number; provider?: string };
    };

    const text = (payload.data?.text || '').trim();
    if (text) {
      return {
        text,
        confidence: payload.data?.confidence,
        provider: payload.data?.provider || 'api',
        source: 'api',
      };
    }
  } catch {
    // ignore and continue to local fallback
  }

  return null;
}

export async function detectTextInImage(imageUrl: string): Promise<OcrResult> {
  if (!imageUrl) throw new Error('An image is required for OCR');

  const preprocessed = await preprocessImageForOcr(imageUrl);
  const tesseractResult = await tryTesseractOcr(preprocessed);
  if (tesseractResult?.text) return tesseractResult;

  const apiResult = await tryApiOcr(preprocessed);
  if (apiResult?.text) return apiResult;

  return {
    text: '',
    provider: 'local',
    source: 'local',
    confidence: 0,
  };
}
