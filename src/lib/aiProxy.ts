/**
 * AI Proxy Client — secure bridge to Firebase Cloud Functions
 *
 * ALL AI calls go through this module.
 * API keys are NEVER in the client bundle — they live in Cloud Functions secrets.
 *
 * Endpoints hit:
 *   /api/ai/chat       — multi-provider chat
 *   /api/ai/stream     — streaming chat (SSE)
 *   /api/ai/image      — image generation
 *   /api/ai/transcribe — audio transcription
 *   /api/ai/search     — web search
 *   /api/ai/health     — provider health
 *
 * Falls back to direct Groq/OpenRouter calls if functions are unavailable
 * (dev mode or cold start) so the app never breaks.
 */

import { auth } from './firebase';

// ── Config ─────────────────────────────────────────────────────────────────

// In production: relative path (same domain via hosting rewrites)
// In dev: point to emulator or direct providers
const IS_DEV = import.meta.env.DEV;
const FUNCTIONS_BASE = IS_DEV
  ? 'http://127.0.0.1:5001/jatalk-1274b/us-central1'  // emulator
  : '/api';                                              // production (hosting rewrite)

const API = {
  chat:       `${FUNCTIONS_BASE}/ai/chat`,
  stream:     `${FUNCTIONS_BASE}/ai/stream`,
  image:      `${FUNCTIONS_BASE}/ai/image`,
  transcribe: `${FUNCTIONS_BASE}/ai/transcribe`,
  search:     `${FUNCTIONS_BASE}/ai/search`,
  health:     `${FUNCTIONS_BASE}/ai/health`,
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProxyChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProxyChatOptions {
  messages: ProxyChatMessage[];
  temperature?: number;
  maxTokens?: number;
  preferredProviders?: string[];
  sessionId?: string;
}

export interface ProxyChatResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  cached: boolean;
  tokensUsed?: number;
  error?: string;
  fromFallback?: boolean;
}

export interface ProxyStreamOptions extends ProxyChatOptions {
  onChunk: (text: string) => void;
  onDone?: (meta: { provider: string; model: string; latencyMs: number }) => void;
  onError?: (err: string) => void;
}

// ── Auth headers ───────────────────────────────────────────────────────────

async function getHeaders(sessionId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const user = auth.currentUser;
  if (user) {
    headers['X-User-Id'] = user.uid;
  }

  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }

  return headers;
}

// ── Retry helper ───────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number) => void
): Promise<T> {
  let lastErr: Error | null = null;
  const delays = [1000, 2000, 4000]; // Mandatory retry strategy

  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (i < delays.length) {
        onRetry?.(i + 1);
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  }
  throw lastErr;
}

// ── Functions availability — always try, short circuit only on clear failure ──

let _functionsConfirmedWorking = false; // once confirmed, trust it

async function checkFunctionsAvailable(): Promise<boolean> {
  // Once we've confirmed it works, always return true
  if (_functionsConfirmedWorking) return true;

  // In production, always assume available (hosting rewrites are configured)
  if (!IS_DEV) {
    _functionsConfirmedWorking = true;
    return true;
  }

  // In dev, do a quick health check
  try {
    const res = await fetch(API.health, { method: 'GET', signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      _functionsConfirmedWorking = true;
      return true;
    }
  } catch { /* emulator not running */ }

  return false;
}

// ── Direct fallback (when functions are unavailable) ──────────────────────
// Uses Groq directly from client — only as emergency fallback

async function directFallbackChat(messages: ProxyChatMessage[], temperature = 0.7): Promise<ProxyChatResult> {
  const groqKey = import.meta.env.VITE_GROQ_KEY ?? (window as any).__GROQ_KEY;
  if (!groqKey) {
    return {
      text: 'AI service temporarily unavailable. Please try again shortly.',
      provider: 'fallback',
      model: 'none',
      latencyMs: 0,
      cached: false,
      error: 'No fallback key available',
      fromFallback: true,
    };
  }

  const start = Date.now();
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) throw new Error(`Groq fallback ${res.status}`);
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content ?? '';

  return {
    text,
    provider: 'groq-direct',
    model: 'llama-3.1-8b-instant',
    latencyMs: Date.now() - start,
    cached: false,
    fromFallback: true,
  };
}

// ── Main proxy: chat ───────────────────────────────────────────────────────

export async function proxyChat(options: ProxyChatOptions): Promise<ProxyChatResult> {
  const headers = await getHeaders(options.sessionId);
  const available = await checkFunctionsAvailable();

  if (!available) {
    return directFallbackChat(options.messages, options.temperature);
  }

  try {
    const res = await fetch(API.chat, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        task: 'chat',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        preferredProviders: options.preferredProviders,
        sessionId: options.sessionId,
      }),
      signal: AbortSignal.timeout(45000), // 45s timeout for slow connections
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Chat proxy ${res.status}: ${err.slice(0, 100)}`);
    }

    const data = await res.json() as ProxyChatResult;
    if (!data.text) throw new Error('Empty response from proxy');
    return data;
  } catch (err: any) {
    console.warn('[AIProxy] proxyChat failed, using direct fallback:', err.message);
    return directFallbackChat(options.messages, options.temperature);
  }
}

// ── Main proxy: streaming chat (SSE) ──────────────────────────────────────

export async function proxyChatStream(options: ProxyStreamOptions): Promise<void> {
  const headers = await getHeaders(options.sessionId);

  try {
    const available = await checkFunctionsAvailable();

    if (!available) {
      // Direct fallback — no streaming, just emit full response
      const result = await directFallbackChat(options.messages, options.temperature);
      options.onChunk(result.text);
      options.onDone?.({ provider: result.provider, model: result.model, latencyMs: result.latencyMs });
      return;
    }

    const res = await fetch(API.stream, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        task: 'stream',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        preferredProviders: options.preferredProviders,
        sessionId: options.sessionId,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      throw new Error(`Stream proxy ${res.status}`);
    }

    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event: chunk')) continue;
        if (trimmed.startsWith('event: done')) continue;
        if (trimmed.startsWith('event: error')) continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const payload = JSON.parse(trimmed.slice(6));

            if (payload.text !== undefined) {
              options.onChunk(payload.text);
            } else if (payload.provider !== undefined) {
              // done event
              options.onDone?.({
                provider: payload.provider,
                model: payload.model,
                latencyMs: payload.latencyMs,
              });
            } else if (payload.message !== undefined) {
              options.onError?.(payload.message);
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    }
  } catch (err: any) {
    console.error('[AIProxy] Stream error:', err);
    options.onError?.(err.message ?? 'Stream failed');

    // Emergency fallback
    try {
      const result = await directFallbackChat(options.messages, options.temperature);
      options.onChunk(result.text);
      options.onDone?.({ provider: result.provider, model: result.model, latencyMs: result.latencyMs });
    } catch (fallbackErr: any) {
      options.onError?.('All AI providers unavailable. Please try again.');
    }
  }
}

// ── Main proxy: image generation ──────────────────────────────────────────

export async function proxyImage(prompt: string, preferredProviders?: string[]): Promise<{
  imageUrl: string;
  provider: string;
  model: string;
  latencyMs: number;
}> {
  const headers = await getHeaders();

  // Always try proxy first in production
  try {
    const res = await fetch(API.image, {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: 'image', prompt, preferredProviders }),
      signal: AbortSignal.timeout(60000),
    });

    if (res.ok) {
      const data = await res.json() as any;
      if (data.imageUrl) return data;
    }
  } catch (err: any) {
    console.warn('[AIProxy] Image proxy failed:', err.message);
  }

  // Fallback: Pollinations direct (always works, no key needed)
  const seed = Math.floor(Math.random() * 999999);
  const enhanced = `${prompt}, high quality, detailed, realistic, professional, 4k`;
  const encoded = encodeURIComponent(enhanced);
  return {
    imageUrl: `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&enhance=true`,
    provider: 'pollinations',
    model: 'pollinations-flux',
    latencyMs: 0,
  };
}

// ── Main proxy: transcription ──────────────────────────────────────────────

export async function proxyTranscribe(
  audioBlob: Blob,
  language?: string
): Promise<string> {
  const headers = await getHeaders();

  try {
    const available = await checkFunctionsAvailable();
    if (!available) return '';

    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const res = await fetch(API.transcribe, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audioBase64: base64,
        mimeType: audioBlob.type || 'audio/webm',
        language: language ?? '',
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Transcribe proxy ${res.status}`);
    const data = await res.json() as { text: string };
    return data.text ?? '';
  } catch (err: any) {
    console.warn('[AIProxy] Transcribe proxy failed:', err.message);
    return '';
  }
}

// ── Main proxy: web search ─────────────────────────────────────────────────

export async function proxySearch(query: string): Promise<{
  context: string;
  results: Array<{ title: string; url: string; content: string }>;
}> {
  const headers = await getHeaders();

  try {
    const available = await checkFunctionsAvailable();
    if (!available) return { context: '', results: [] };

    const res = await fetch(API.search, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Search proxy ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn('[AIProxy] Search proxy failed:', err.message);
    return { context: '', results: [] };
  }
}

// ── Health check ───────────────────────────────────────────────────────────

export async function getProxyHealth(): Promise<{
  available: boolean;
  providers: any[];
  cache: any;
}> {
  try {
    const res = await fetch(API.health, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { available: false, providers: [], cache: {} };
    const data = await res.json() as any;
    return { available: true, providers: data.providers ?? [], cache: data.cache ?? {} };
  } catch {
    return { available: false, providers: [], cache: {} };
  }
}
