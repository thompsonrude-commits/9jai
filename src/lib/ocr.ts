import { DEFAULT_MAX_INLINE_IMAGE_BYTES, normalizeImageForVision } from './imageNormalization';

export interface OcrResult {
  text: string;
  confidence?: number;
  provider?: string;
  language?: string;
}

export async function detectTextInImage(imageUrl: string): Promise<OcrResult> {
  if (!imageUrl) throw new Error('An image is required for OCR');

  const normalizedImage = await normalizeImageForVision(imageUrl, {
    maxDimension: 1600,
    maxBytes: DEFAULT_MAX_INLINE_IMAGE_BYTES,
    quality: 0.86,
  });

  const response = await fetch('/api/v1/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: normalizedImage.dataUrl, language: 'eng', layout: true }),
    signal: AbortSignal.timeout(120000),
  });

  const payload = await response.json().catch(() => ({})) as {
    data?: { text?: string; confidence?: number; provider?: string };
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    const reason = payload.error || payload.message || 'OCR engine is temporarily unavailable';
    if (response.status === 413 || /IMAGE_TOO_LARGE/i.test(reason)) {
      throw new Error('Image is too large for OCR. Please resize or compress it and try again.');
    }
    throw new Error(reason);
  }

  const text = payload.data?.text?.trim() || '';
  if (!text) throw new Error('No readable text was found in the image');

  return {
    text,
    confidence: payload.data?.confidence,
    provider: payload.data?.provider,
  };
}
