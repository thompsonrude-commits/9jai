/**
 * HuggingFace Inference API provider
 * https://huggingface.co/docs/api-inference
 */

import { defineSecret } from 'firebase-functions/params';
import { ChatMessage } from '../types';
import { normalizeChatMessagesForProvider } from '../providerPayload';
import { getSecretValue } from './secretHelpers';

export const HF_KEY = defineSecret('HF_KEY');

const BASE_URL = 'https://router.huggingface.co/hf-inference';

export const HF_CHAT_MODELS = [
  'meta-llama/Llama-3.1-8B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'microsoft/DialoGPT-large',
];

export const HF_IMAGE_MODELS = [
  'stabilityai/stable-diffusion-2-1',
  'runwayml/stable-diffusion-v1-5',
];

export const HF_VIDEO_MODELS = [
  'damo-vilab/text-to-video-ms-1.7b',
  'ali-vilab/text-to-video-synthesis',
];

export async function huggingfaceVision(
  imageBase64: string,
  prompt: string,
  model = 'Salesforce/blip-image-captioning-base',
): Promise<{ text: string; model: string }> {
  const key = getSecretValue('HF_KEY', HF_KEY);
  if (!key) throw new Error('HF_KEY secret not configured');

  let imageBuffer: Buffer;
  if (imageBase64.startsWith('data:')) {
    const encoded = imageBase64.slice(imageBase64.indexOf(',') + 1);
    imageBuffer = Buffer.from(encoded, 'base64');
  } else {
    const response = await fetch(imageBase64);
    if (!response.ok) throw new Error(`HuggingFace vision image fetch ${response.status}`);
    imageBuffer = Buffer.from(await response.arrayBuffer());
  }

  const res = await fetch(`${BASE_URL}/models/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Authorization': `Bearer ${key}`,
    },
    body: imageBuffer,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace vision ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as Array<{ generated_text?: string }>;
  const text = data[0]?.generated_text?.trim() || '';
  if (!text) throw new Error(`HuggingFace vision returned no caption for prompt: ${prompt}`);
  return { text, model };
}

// ── Chat (text generation) ─────────────────────────────────────────────────

export async function hfChat(
  messages: ChatMessage[],
  model = HF_CHAT_MODELS[0],
  temperature = 0.7,
  maxTokens = 1024
): Promise<{ text: string; model: string }> {
  const key = getSecretValue('HF_KEY', HF_KEY);
  if (!key) throw new Error('HF_KEY secret not configured');

  const normalizedMessages = normalizeChatMessagesForProvider(messages, 'huggingface');

  // Build prompt from messages
  const prompt = normalizedMessages.map(m => {
    if (m.role === 'system') return `<|system|>\n${m.content}`;
    if (m.role === 'user') return `<|user|>\n${m.content}`;
    return `<|assistant|>\n${m.content}`;
  }).join('\n') + '\n<|assistant|>\n';

  const res = await fetch(`${BASE_URL}/models/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature,
        return_full_text: false,
        do_sample: true,
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) ?? '';

  return { text: text.trim(), model };
}

// ── Image generation ───────────────────────────────────────────────────────

export async function hfImage(
  prompt: string,
  model = HF_IMAGE_MODELS[0]
): Promise<{ imageBase64: string; model: string }> {
  const key = getSecretValue('HF_KEY', HF_KEY);
  if (!key) throw new Error('HF_KEY secret not configured');

  const res = await fetch(`${BASE_URL}/models/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace image ${res.status}: ${err.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  return { imageBase64: `data:image/png;base64,${base64}`, model };
}

// ── Video generation ───────────────────────────────────────────────────────

export async function huggingfaceVideo(
  prompt: string,
  model = HF_VIDEO_MODELS[0]
): Promise<{ videoUrl: string; model: string; duration?: number }> {
  const key = getSecretValue('HF_KEY', HF_KEY);
  if (!key) throw new Error('HF_KEY secret not configured');

  const res = await fetch(`${BASE_URL}/models/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        num_frames: 16,        // 16 frames ~0.5s at 30fps
        num_inference_steps: 25,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HuggingFace video ${res.status}: ${err.slice(0, 200)}`);
  }

  // Response is video blob (MP4)
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const videoUrl = `data:video/mp4;base64,${base64}`;

  return {
    videoUrl,
    model,
    duration: 0.5, // ~0.5 seconds for 16 frames at 30fps
  };
}
