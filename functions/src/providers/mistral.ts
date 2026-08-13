/**
 * Mistral AI provider
 * https://docs.mistral.ai
 */

import { defineSecret } from 'firebase-functions/params';
import { ChatMessage } from '../types';
import { normalizeChatMessagesForProvider } from '../providerPayload';
import { getSecretValue } from './secretHelpers';

export const MISTRAL_KEY = defineSecret('MISTRAL_KEY');

const BASE_URL = 'https://api.mistral.ai/v1';

export const MISTRAL_MODELS = [
  'mistral-small-latest',
  'mistral-medium-latest',
  'open-mistral-7b',
  'open-mixtral-8x7b',
];

export async function mistralChat(
  messages: ChatMessage[],
  model = MISTRAL_MODELS[0],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  const key = getSecretValue('MISTRAL_KEY', MISTRAL_KEY);
  if (!key) throw new Error('MISTRAL_KEY secret not configured');

  const normalizedMessages = normalizeChatMessagesForProvider(messages, 'mistral');

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
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data.usage?.total_tokens;

  return { text, model, tokensUsed };
}
