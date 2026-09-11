/**
 * Grok provider integration for the 9jai AI stack.
 * Keeps the existing Grok capability available without requiring a full rewrite.
 */

import { defineSecret } from 'firebase-functions/params';
import { ChatMessage } from '../types';
import { normalizeChatMessagesForProvider } from '../providerPayload';
import { getSecretValue } from './secretHelpers';

export const GROK_KEY = defineSecret('GROK_KEY');

const BASE_URL = 'https://api.x.ai/v1';

export const GROK_MODELS = [
  'grok-3-mini-fast-beta',
  'grok-2-latest',
];

export async function grokChat(
  messages: ChatMessage[],
  model = GROK_MODELS[0],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  const key = getSecretValue('GROK_KEY', GROK_KEY);
  if (!key) throw new Error('GROK_KEY secret not configured');

  const normalizedMessages = normalizeChatMessagesForProvider(messages, 'grok');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
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
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Grok auth failed (${res.status}): ${err.slice(0, 200)}`);
    }
    if (res.status === 404) {
      throw new Error(`Grok model not found (${model}): ${err.slice(0, 200)}`);
    }
    throw new Error(`Grok ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, model: data.model ?? model, tokensUsed: data.usage?.total_tokens };
}

export async function grokChatWithFallback(
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  let lastError: Error | null = null;
  for (const model of GROK_MODELS) {
    try {
      const result = await grokChat(messages, model, temperature, maxTokens);
      if (result.text) return result;
    } catch (err: any) {
      lastError = err;
      const status = Number(String(err?.message || '').match(/\b([45]\d{2})\b/)?.[1] ?? 0);
      if (status === 401 || status === 403 || status === 404) {
        throw err;
      }
      continue;
    }
  }
  throw lastError ?? new Error('All Grok models exhausted');
}
