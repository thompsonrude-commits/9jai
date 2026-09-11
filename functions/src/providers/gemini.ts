/**
 * Google Gemini Image Generation Provider
 * Tries gemini-2.0-flash-preview-image-generation (free tier)
 * Falls back to imagen-3.0-generate-002 if needed
 */

import { defineSecret } from 'firebase-functions/params';
import { getSecretValue } from './secretHelpers';

export const GEMINI_KEY = defineSecret('GEMINI_KEY');

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Models to try in order — both work on free tier
const IMAGE_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp',
];

export interface GeminiImageResult {
  imageBase64: string;
  mimeType: string;
  model: string;
}

/**
 * Generate image using Google Gemini
 * Returns base64 image data (NOT a URL — avoids CORS issues on canvas)
 */
export async function geminiGenerateImage(
  prompt: string
): Promise<GeminiImageResult> {
  const key = getSecretValue('GEMINI_KEY', GEMINI_KEY);
  if (!key) throw new Error('GEMINI_KEY not configured');

  console.log('[Gemini] Generating image with prompt:', prompt.slice(0, 100));

  let lastError: Error | null = null;

  for (const model of IMAGE_MODELS) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['IMAGE'],
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini ${model} failed: ${response.status} ${err.slice(0, 200)}`);
      }

      const data = await response.json() as any;
      const parts = data?.candidates?.[0]?.content?.parts ?? [];

      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          console.log(`[Gemini] ✓ Image generated with ${model}`);
          return {
            imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            mimeType: part.inlineData.mimeType,
            model,
          };
        }
      }

      throw new Error(`Gemini ${model} returned no image in response`);
    } catch (err: any) {
      console.warn(`[Gemini] Model ${model} failed:`, err.message);
      lastError = err;
      continue;
    }
  }

  throw lastError ?? new Error('All Gemini image models exhausted');
}
