/**
 * Intelligent AI Router — the brain of the 9jai proxy layer
 *
 * Routing strategy:
 * 1. OpenRouter  — PRIMARY (200+ models, best coverage)
 * 2. Groq        — SPEED fallback (ultra-low latency)
 * 3. Together AI — QUALITY fallback (strong open-source)
 * 4. DeepSeek    — REASONING fallback (complex tasks)
 * 5. Mistral     — EUROPEAN fallback
 * 6. HuggingFace — LAST RESORT (free, slower)
 *
 * Routing decisions are based on:
 * - Provider health (consecutive failures, success rate)
 * - Task type (chat, code, reasoning, image)
 * - Preferred providers from client
 * - Response latency history
 */

import { AIRequest, AIResponse, ProviderId, RoutingDecision, TaskType } from './types';
import { isProviderAvailable, recordProviderSuccess, recordProviderFailure, startTimer, getProviderHealth } from './logger';
import { getCached, setCached, buildCacheKey } from './cache';
import { openRouterChatWithFallback } from './providers/openrouter';
import { groqChatWithFallback, groqTranscribe } from './providers/groq';
import { togetherChat, togetherImage } from './providers/together';
import { deepseekChat } from './providers/deepseek';
import { mistralChat } from './providers/mistral';
import { hfChat } from './providers/huggingface';
import { tavilySearch, buildSearchContext } from './providers/tavily';
import { pollinationsWithFallback, getPollinationsUrl } from './providers/pollinations';
import { ChatMessage } from './types';

// ── Provider priority chains per task ─────────────────────────────────────

const CHAT_CHAIN: ProviderId[] = ['openrouter', 'groq', 'together', 'deepseek', 'mistral', 'huggingface'];
const IMAGE_CHAIN: ProviderId[] = ['openrouter', 'together', 'huggingface'];
const TRANSCRIBE_CHAIN: ProviderId[] = ['groq'];
const SEARCH_CHAIN: ProviderId[] = ['openrouter']; // search uses Tavily internally

// Task-specific model hints
const TASK_HINTS: Record<string, string> = {
  code: 'deepseek',
  reasoning: 'deepseek',
  translation: 'openrouter',
  creative: 'openrouter',
  math: 'deepseek',
};

// ── Detect task specialization from messages ───────────────────────────────

function detectSpecialization(messages: ChatMessage[]): string | null {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return null;
  const lower = lastUser.content.toLowerCase();

  if (lower.includes('code') || lower.includes('function') || lower.includes('debug') || lower.includes('program')) return 'code';
  if (lower.includes('reason') || lower.includes('analyze') || lower.includes('think step')) return 'reasoning';
  if (lower.includes('translate') || lower.includes('language')) return 'translation';
  if (lower.includes('write') || lower.includes('poem') || lower.includes('story') || lower.includes('lyrics')) return 'creative';
  if (lower.includes('math') || lower.includes('calculate') || lower.includes('equation')) return 'math';

  return null;
}

// ── Build ordered provider chain ───────────────────────────────────────────

function buildProviderChain(
  task: TaskType,
  preferred?: ProviderId[],
  messages?: ChatMessage[]
): ProviderId[] {
  let base: ProviderId[];

  switch (task) {
    case 'image': base = IMAGE_CHAIN; break;
    case 'transcribe': base = TRANSCRIBE_CHAIN; break;
    case 'search': base = SEARCH_CHAIN; break;
    default: base = CHAT_CHAIN;
  }

  // Detect specialization and promote relevant provider
  if (messages && (task === 'chat' || task === 'stream')) {
    const spec = detectSpecialization(messages);
    if (spec && TASK_HINTS[spec]) {
      const hinted = TASK_HINTS[spec] as ProviderId;
      base = [hinted, ...base.filter(p => p !== hinted)];
    }
  }

  // Prepend preferred providers
  if (preferred && preferred.length > 0) {
    const unique = [...preferred, ...base.filter(p => !preferred.includes(p))];
    base = unique;
  }

  // Filter out unavailable providers
  return base.filter(p => isProviderAvailable(p));
}

// ── Make routing decision ──────────────────────────────────────────────────

export function makeRoutingDecision(
  task: TaskType,
  preferred?: ProviderId[],
  messages?: ChatMessage[]
): RoutingDecision {
  const chain = buildProviderChain(task, preferred, messages);
  const selected = chain[0] ?? 'openrouter';
  const health = getProviderHealth(selected);

  return {
    selectedProvider: selected,
    selectedModel: 'auto',
    reason: preferred?.includes(selected)
      ? 'client-preferred'
      : health.consecutiveFailures === 0
        ? 'primary-healthy'
        : 'best-available',
    fallbackChain: chain.slice(1),
    estimatedLatencyMs: health.avgLatencyMs,
  };
}

// ── Execute chat with full failover ───────────────────────────────────────

async function executeChatProvider(
  provider: ProviderId,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  switch (provider) {
    case 'openrouter': return openRouterChatWithFallback(messages, temperature, maxTokens);
    case 'groq':       return groqChatWithFallback(messages, temperature, maxTokens);
    case 'together':   return togetherChat(messages, undefined, temperature, maxTokens);
    case 'deepseek':   return deepseekChat(messages, undefined, temperature, maxTokens);
    case 'mistral':    return mistralChat(messages, undefined, temperature, maxTokens);
    case 'huggingface':return hfChat(messages, undefined, temperature, maxTokens);
    default:           return openRouterChatWithFallback(messages, temperature, maxTokens);
  }
}

// ── Needs web search? ──────────────────────────────────────────────────────

function needsWebSearch(messages: ChatMessage[]): boolean {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return false;
  const lower = lastUser.content.toLowerCase();

  const triggers = [
    'latest', 'current', 'today', 'news', 'recent', '2025', '2026',
    'price', 'weather', 'stock', 'score', 'result', 'who won',
    'what happened', 'breaking', 'search', 'look up', 'find out',
  ];
  return triggers.some(t => lower.includes(t));
}

// ── Main router: chat ──────────────────────────────────────────────────────

export async function routeChat(req: AIRequest): Promise<AIResponse> {
  const messages = req.messages ?? [];
  const temperature = req.temperature ?? 0.7;
  const maxTokens = req.maxTokens ?? 2048;
  const timer = startTimer();

  // Cache check
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const cacheKey = buildCacheKey('chat', lastUser?.content ?? '', req.model);
  const cached = await getCached(cacheKey);
  if (cached) {
    return {
      text: cached.value,
      provider: cached.provider,
      model: cached.model,
      latencyMs: timer(),
      cached: true,
    };
  }

  // Inject web search context if needed
  let enrichedMessages = messages;
  if (needsWebSearch(messages) && lastUser) {
    try {
      const searchRes = await tavilySearch(lastUser.content, 5, 'basic');
      const context = buildSearchContext(searchRes);
      if (context) {
        enrichedMessages = messages.map(m =>
          m === lastUser
            ? { ...m, content: `${m.content}\n\n[Realtime web context]:\n${context}` }
            : m
        );
      }
    } catch (err) {
      console.warn('[Router] Web search failed, continuing without:', err);
    }
  }

  // Build provider chain
  const chain = buildProviderChain('chat', req.preferredProviders, messages);

  let lastError: Error | null = null;

  for (const provider of chain) {
    const providerTimer = startTimer();
    try {
      const result = await executeChatProvider(provider, enrichedMessages, temperature, maxTokens);

      if (!result.text) continue;

      const latencyMs = providerTimer();
      recordProviderSuccess(provider, latencyMs);

      // Cache successful responses (5 min TTL)
      await setCached(cacheKey, result.text, provider, result.model, 5 * 60 * 1000);

      console.info(`[Router] Chat: ${provider}/${result.model} in ${latencyMs}ms`);

      return {
        text: result.text,
        provider,
        model: result.model,
        latencyMs: timer(),
        cached: false,
        tokensUsed: result.tokensUsed,
      };
    } catch (err: any) {
      lastError = err;
      recordProviderFailure(provider, err.message);
      console.warn(`[Router] Provider ${provider} failed, trying next: ${err.message}`);
      continue;
    }
  }

  // All providers failed
  const fallbackText = 'Network busy right now. Please try again in a few moments.';
  return {
    text: fallbackText,
    provider: 'openrouter',
    model: 'fallback',
    latencyMs: timer(),
    cached: false,
    error: lastError?.message,
  };
}

// ── Main router: image ─────────────────────────────────────────────────────
// Returns base64 data URL so browser renders instantly without waiting

export async function routeImage(req: AIRequest): Promise<{
  imageUrl: string;
  imageBase64?: string;
  provider: ProviderId;
  model: string;
  latencyMs: number;
}> {
  const prompt = req.prompt ?? '';
  const timer = startTimer();

  // ── NO CACHE for images — every generation must be unique ──────────────
  // Caching causes identical outputs for the same prompt.
  // The visual intelligence engine generates unique prompts + seeds every call.
  console.info(`[Router] Image generation: "${prompt.slice(0, 60)}"`);

  // ── STEP 1: Try Together AI (FLUX.1-schnell-Free — real AI generation) ──
  if (isProviderAvailable('together')) {
    try {
      const result = await togetherImage(prompt);
      if (result.imageUrl) {
        recordProviderSuccess('together', timer());
        console.info(`[Router] Image from Together AI in ${timer()}ms`);
        return { imageUrl: result.imageUrl, provider: 'together', model: result.model, latencyMs: timer() };
      }
    } catch (err: any) {
      recordProviderFailure('together', err.message);
      console.warn(`[Router] Together AI image failed: ${err.message}`);
    }
  }

  // ── STEP 2: Pollinations AI (fetches actual bytes server-side) ─────
  try {
    const result = await pollinationsWithFallback(prompt);
    if (result.imageBase64) {
      recordProviderSuccess('pollinations', timer());
      console.info(`[Router] Image from Pollinations in ${timer()}ms | mode=${result.mode} | quality=${result.quality}`);
      return {
        imageUrl: result.url,
        imageBase64: result.imageBase64,
        provider: 'pollinations',
        model: result.model,
        latencyMs: timer(),
      };
    }
  } catch (err: any) {
    console.warn(`[Router] Pollinations failed: ${err.message}`);
  }

  // ── STEP 3: HuggingFace (if key available) ────────────────────────────────
  if (isProviderAvailable('huggingface')) {
    try {
      const { hfImage } = await import('./providers/huggingface');
      const result = await hfImage(prompt);
      if (result.imageBase64) {
        recordProviderSuccess('huggingface', timer());
        return {
          imageUrl: result.imageBase64,
          imageBase64: result.imageBase64,
          provider: 'huggingface',
          model: result.model,
          latencyMs: timer(),
        };
      }
    } catch (err: any) {
      recordProviderFailure('huggingface', err.message);
      console.warn(`[Router] HuggingFace image failed: ${err.message}`);
    }
  }

  // ── ABSOLUTE FALLBACK: Return Pollinations URL (browser will load it) ─────
  const { getPollinationsUrl } = await import('./providers/pollinations');
  const fallbackUrl = getPollinationsUrl(prompt);

  console.warn(`[Router] All image providers failed, returning URL fallback`);
  return {
    imageUrl: fallbackUrl,
    provider: 'pollinations',
    model: 'pollinations-url-fallback',
    latencyMs: timer(),
  };
}

// ── Main router: transcribe ────────────────────────────────────────────────

export async function routeTranscribe(
  audioBuffer: Buffer,
  mimeType: string,
  language?: string
): Promise<{ text: string; provider: ProviderId; latencyMs: number }> {
  const timer = startTimer();

  try {
    const text = await groqTranscribe(audioBuffer, mimeType, language ?? '');
    recordProviderSuccess('groq', timer());
    return { text, provider: 'groq', latencyMs: timer() };
  } catch (err: any) {
    recordProviderFailure('groq', err.message);
    return { text: '', provider: 'groq', latencyMs: timer() };
  }
}

// ── Main router: search ────────────────────────────────────────────────────

export async function routeSearch(query: string): Promise<{ context: string; results: any[]; latencyMs: number }> {
  const timer = startTimer();

  try {
    const res = await tavilySearch(query, 6, 'advanced');
    return {
      context: buildSearchContext(res),
      results: res.results,
      latencyMs: timer(),
    };
  } catch (err: any) {
    console.warn('[Router] Search failed:', err.message);
    return { context: '', results: [], latencyMs: timer() };
  }
}
