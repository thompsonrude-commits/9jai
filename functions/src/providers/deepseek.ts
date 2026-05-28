/**
 * DeepSeek provider — excellent reasoning + coding models
 * https://platform.deepseek.com/docs
 */

import { defineSecret } from 'firebase-functions/params';
import { ChatMessage } from '../types';

export const DEEPSEEK_KEY = defineSecret('DEEPSEEK_KEY');

const BASE_URL = 'https://api.deepseek.com/v1';

export const DEEPSEEK_MODELS = [
  'deepseek-chat',
  'deepseek-reasoner',
];

export async function deepseekChat(
  messages: ChatMessage[],
  model = DEEPSEEK_MODELS[0],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  const key = DEEPSEEK_KEY.value();
  if (!key) throw new Error('DEEPSEEK_KEY secret not configured');

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
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data.usage?.total_tokens;

  return { text, model, tokensUsed };
}
