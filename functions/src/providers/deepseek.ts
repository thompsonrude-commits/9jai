/**
 * DeepSeek is intentionally disabled in the active 9ja AI provider stack.
 * Grok, Groq and Ollama remain the active LLM providers.
 */

export const DEEPSEEK_MODELS: string[] = [];

export function deepseekChat(): Promise<{ text: string; model: string; tokensUsed?: number }> {
  return Promise.reject(new Error('DeepSeek is not installed in the active provider stack.'));
}
