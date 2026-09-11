/**
 * OpenRouter provider — PRIMARY production provider
 * Routes to 200+ models via a single API
 * https://openrouter.ai/docs
 */

import { defineSecret } from 'firebase-functions/params';
import { ChatMessage } from '../types';
import { normalizeChatMessagesForProvider } from '../providerPayload';
import { getSecretValue } from './secretHelpers';

export const OPENROUTER_KEY = defineSecret('OPENROUTER_KEY');

const BASE_URL = 'https://openrouter.ai/api/v1';
const SITE_URL = 'https://9jai.web.app';
const SITE_NAME = '9jai African AI';

// ── Vision-capable models (multimodal) ────────────────────────────────────
export const OPENROUTER_VISION_MODELS = [
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen2-vl-7b-instruct:free',
  'meta-llama/llama-3.2-90b-vision-instruct:free',
];

// Model priority list — best free/cheap models first
export const OPENROUTER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'openai/gpt-oss-20b:free',
];

// ── Vision chat — sends image + text to multimodal model ─────────────────

export async function openRouterVisionChat(
  imageBase64: string,
  prompt: string,
  temperature = 0.7
): Promise<{ text: string; model: string }> {
  const key = getSecretValue('OPENROUTER_KEY', OPENROUTER_KEY);
  if (!key) throw new Error('OPENROUTER_KEY secret not configured');

  // Strip the data URL prefix to get pure base64
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const mimeType   = imageBase64.startsWith('data:') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`,
            detail: 'high',
          },
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    },
  ];

  let lastError: Error | null = null;
  for (const model of OPENROUTER_VISION_MODELS) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 2048,
          stream: false,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter vision ${res.status}: ${err.slice(0, 200)}`);
      }

      const data = await res.json() as any;
      const text = data.choices?.[0]?.message?.content ?? '';
      if (text) return { text, model };
    } catch (err: any) {
      lastError = err;
      console.warn(`[OpenRouter Vision] Model ${model} failed: ${err.message}`);
      if (err.message.includes('401') || err.message.includes('403')) throw err;
      continue;
    }
  }

  throw lastError ?? new Error('All vision models exhausted');
}

// ── Image-to-image editing via Pollinations edit endpoint ─────────────────

export async function openRouterImageEdit(
  imageBase64: string,
  editPrompt: string
): Promise<{ imageUrl: string; model: string }> {
  const key = getSecretValue('OPENROUTER_KEY', OPENROUTER_KEY);
  if (!key) throw new Error('OPENROUTER_KEY secret not configured');

  // Use vision model to understand image + generate edited description,
  // then generate a new image based on the description + edit instruction
  const visionPrompt = `Look at this image carefully. Then generate a detailed description of it, applying these changes: ${editPrompt}. Be very specific about: colors, clothing, hair, background, lighting, style, and all visual details. Output ONLY the image description for a text-to-image model.`;

  // Step 1: Use vision to understand current image and plan the edit
  let editDescription = editPrompt;
  try {
    const visionResult = await openRouterVisionChat(imageBase64, visionPrompt, 0.5);
    editDescription = visionResult.text;
  } catch {
    editDescription = `${editPrompt}, photorealistic, high quality, 8k`;
  }

  // Step 2: Generate new image based on description
  const imageResult = await openRouterImage(editDescription);
  return { imageUrl: imageResult.imageUrl, model: imageResult.model };
}

// ── Non-streaming chat ─────────────────────────────────────────────────────

export async function openRouterChat(
  messages: ChatMessage[],
  model = OPENROUTER_MODELS[0],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  const key = getSecretValue('OPENROUTER_KEY', OPENROUTER_KEY);
  if (!key) throw new Error('OPENROUTER_KEY secret not configured');

  const normalizedMessages = normalizeChatMessagesForProvider(messages, 'openrouter');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
    body: JSON.stringify({
      model,
      messages: normalizedMessages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data.usage?.total_tokens;
  const usedModel = data.model ?? model;

  return { text, model: usedModel, tokensUsed };
}

// ── Streaming chat — returns a ReadableStream ──────────────────────────────

export async function openRouterStream(
  messages: ChatMessage[],
  model = OPENROUTER_MODELS[0],
  temperature = 0.7,
  maxTokens = 2048
): Promise<ReadableStream<Uint8Array>> {
  const key = getSecretValue('OPENROUTER_KEY', OPENROUTER_KEY);
  if (!key) throw new Error('OPENROUTER_KEY secret not configured');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter stream ${res.status}: ${err.slice(0, 200)}`);
  }

  if (!res.body) throw new Error('OpenRouter: no response body');
  return res.body;
}

// ── Model fallback — tries each model until one works ─────────────────────

export async function openRouterChatWithFallback(
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  let lastError: Error | null = null;

  for (const model of OPENROUTER_MODELS) {
    try {
      const result = await openRouterChat(messages, model, temperature, maxTokens);
      if (result.text) return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[OpenRouter] Model ${model} failed: ${err.message}`);
      // If rate limited (429), try next model immediately
      // If server error (5xx), try next model
      // If auth error (401/403), stop trying
      if (err.message.includes('401') || err.message.includes('403')) {
        throw err;
      }
      continue;
    }
  }

  throw lastError ?? new Error('All OpenRouter models exhausted');
}

// ── Image generation via OpenRouter ───────────────────────────────────────

export async function openRouterImage(
  prompt: string
): Promise<{ imageUrl: string; model: string }> {
  const key = getSecretValue('OPENROUTER_KEY', OPENROUTER_KEY);
  if (!key) throw new Error('OPENROUTER_KEY secret not configured');

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
    },
    body: JSON.stringify({
      model: 'openai/dall-e-3',
      prompt,
      size: '1024x1024',
      n: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter image ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const imageUrl = data?.data?.[0]?.url ?? data?.output?.[0]?.url;
  if (!imageUrl) throw new Error('OpenRouter: no image URL in response');

  return { imageUrl, model: 'openai/dall-e-3' };
}
