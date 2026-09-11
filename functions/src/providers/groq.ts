/**
 * Groq provider — ultra-fast inference (Llama, Gemma, Mixtral)
 * https://console.groq.com/docs
 */

import { defineSecret } from 'firebase-functions/params';
import { ChatMessage } from '../types';
import { normalizeChatMessagesForProvider } from '../providerPayload';
import { getSecretValue } from './secretHelpers';

export const GROQ_KEY = defineSecret('GROQ_KEY');

const BASE_URL = 'https://api.groq.com/openai/v1';

export const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

export const GROQ_VISION_MODELS = [
  'qwen/qwen3.6-27b',
];

// ── Non-streaming chat ─────────────────────────────────────────────────────

export async function groqChat(
  messages: ChatMessage[],
  model = GROQ_MODELS[0],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  const key = getSecretValue('GROQ_KEY', GROQ_KEY);
  if (!key) throw new Error('GROQ_KEY secret not configured');

  const normalizedMessages = normalizeChatMessagesForProvider(messages, 'groq');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
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
    throw new Error(`Groq ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data.usage?.total_tokens;

  return { text, model, tokensUsed };
}

// ── Streaming chat ─────────────────────────────────────────────────────────

export async function groqStream(
  messages: ChatMessage[],
  model = GROQ_MODELS[0],
  temperature = 0.7,
  maxTokens = 2048
): Promise<ReadableStream<Uint8Array>> {
  const key = getSecretValue('GROQ_KEY', GROQ_KEY);
  if (!key) throw new Error('GROQ_KEY secret not configured');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
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
    throw new Error(`Groq stream ${res.status}: ${err.slice(0, 200)}`);
  }

  if (!res.body) throw new Error('Groq: no response body');
  return res.body;
}

// ── With model fallback ────────────────────────────────────────────────────

export async function groqChatWithFallback(
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  let lastError: Error | null = null;

  for (const model of GROQ_MODELS) {
    try {
      const result = await groqChat(messages, model, temperature, maxTokens);
      if (result.text) return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Groq] Model ${model} failed: ${err.message}`);
      const status = Number(err.message.match(/\b([45]\d{2})\b/)?.[1] ?? 0);
      if ([400, 401, 403, 404, 413].includes(status)) throw err;
      continue;
    }
  }

  throw lastError ?? new Error('All Groq models exhausted');
}

// ── Whisper transcription ──────────────────────────────────────────────────

export async function groqTranscribe(
  audioBuffer: Buffer,
  mimeType = 'audio/webm',
  language = ''
): Promise<string> {
  const key = getSecretValue('GROQ_KEY', GROQ_KEY);
  if (!key) throw new Error('GROQ_KEY secret not configured');

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, 'recording.webm');
  formData.append('model', 'whisper-large-v3');
  if (language) formData.append('language', language);
  formData.append('response_format', 'json');
  formData.append('temperature', '0');

  const res = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Whisper ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  return (data.text ?? '').trim();
}

// ── Vision (image analysis) ────────────────────────────────────────────────

function parseImageInput(input: string) {
  const isDataUrl = typeof input === 'string' && input.startsWith('data:');
  let mimeType = 'image/jpeg';
  let base64Data = input ?? '';

  if (isDataUrl) {
    const m = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
    if (m) {
      mimeType = m[1];
      base64Data = m[2];
    } else {
      const idx = input.indexOf(',');
      base64Data = idx >= 0 ? input.slice(idx + 1) : '';
    }
  }

  base64Data = base64Data.replace(/\s+/g, '');

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (e) {
    buffer = Buffer.alloc(0);
  }

  if (buffer.length >= 4) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) mimeType = 'image/jpeg';
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) mimeType = 'image/png';
    else if (buffer.slice(0,4).toString() === 'RIFF' && buffer.slice(8,12).toString() === 'WEBP') mimeType = 'image/webp';
  }

  return {
    isDataUrl,
    mimeType,
    base64Data,
    byteLength: buffer.length,
    buffer,
    base64Length: base64Data.length,
  };
}

export async function groqVision(
  imageBase64: string,
  prompt: string,
  model = GROQ_VISION_MODELS[0],
  temperature = 0.3
): Promise<{ text: string; model: string }> {
  const key = getSecretValue('GROQ_KEY', GROQ_KEY);
  if (!key) throw new Error('GROQ_KEY secret not configured');

  // Parse and validate incoming image payload
  const parsed = parseImageInput(imageBase64 ?? '');
  console.log(`[Groq] Vision payload metadata: mime=${parsed.mimeType}, bytes=${parsed.byteLength}, base64Len=${parsed.base64Length}, isDataUrl=${parsed.isDataUrl}`);

  if (!parsed.byteLength) {
    throw new Error('Invalid image payload: zero-length after base64 decoding');
  }
  // Prefer hosting small image bytes on a temporary storage URL that Groq can fetch
  let imageUrl = `data:${parsed.mimeType};base64,${parsed.base64Data}`;

  async function tryUploadToStorage(buffer: Buffer, mimeType: string) {
    try {
      const admin = await import('firebase-admin');
      if (!admin.apps || admin.apps.length === 0) {
        try { admin.initializeApp(); } catch (e) { /* already initialized elsewhere */ }
      }
      // Determine bucket name: prefer explicit env var, then GCLOUD_PROJECT-based default, then a safe fallback
      const inferredProject = process.env.GCLOUD_PROJECT || process.env.GCLOUD_PROJECT_ID || (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : undefined);
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || (inferredProject ? `${inferredProject}.appspot.com` : undefined) || 'jatalk-1274b.appspot.com';
      const bucket = admin.storage().bucket(bucketName);
      if (!bucket) return null;

      const ext = mimeType.split('/')[1] ?? 'png';
      const filename = `9jai-vision/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const file = bucket.file(filename);
      await file.save(parsed.buffer, { contentType: mimeType });

      const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
      return url;
    } catch (e: any) {
      console.warn('[Groq] uploadToStorage failed:', e?.message ?? e);
      return null;
    }
  }

  // Optionally try hosting the image so Groq can fetch it (many APIs accept HTTPS URLs).
  // Hosting fallback is gated by ENABLE_HOSTED_IMAGE_FALLBACK=true to avoid making Storage mandatory.
  let hosted: string | null = null;
  if (String(process.env.ENABLE_HOSTED_IMAGE_FALLBACK || '').toLowerCase() === 'true') {
    hosted = await tryUploadToStorage(parsed.buffer, parsed.mimeType);
    if (hosted) {
      console.log('[Groq] uploaded image to storage for hosting, using hosted URL');
      imageUrl = hosted;
    } else {
      console.log('[Groq] hosting configured but upload failed; sending as data URL');
    }
  } else {
    console.log('[Groq] hosting fallback not enabled; sending as data URL');
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq vision ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';

  return { text, model };
}

// ── Vision with model fallback ─────────────────────────────────────────────

export async function groqVisionWithFallback(
  imageBase64: string,
  prompt: string,
  temperature = 0.3
): Promise<{ text: string; model: string }> {
  let lastError: Error | null = null;

  for (const model of GROQ_VISION_MODELS) {
    try {
      const result = await groqVision(imageBase64, prompt, model, temperature);
      if (result.text) return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Groq] Vision model ${model} failed: ${err.message}`);
      if (err.message.includes('401') || err.message.includes('403')) throw err;
      continue;
    }
  }

  throw lastError ?? new Error('All Groq vision models exhausted');
}
