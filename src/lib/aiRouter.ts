// aiRouter.ts — Multi-provider router with adapter hooks

// Purpose: provide a unified client API that tries configured providers in order,
// supports per-provider URLs + keys via env, caching, and simple fallback logic.

type ModelProvider = 'openrouter' | 'groq' | 'together' | 'huggingface' | 'ollama' | 'local' | 'pollinations' | 'deepseek' | 'mistral' | 'llama';

export interface ModelCallOptions {
  task: 'chat' | 'embed' | 'image' | 'code' | 'summarize' | 'translate';
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  preferredProviders?: ModelProvider[];
}

// Simple in-memory cache (process-local). Good for low-volume edge use.
const cache = new Map<string, { ts: number; ttl: number; data: any }>();
function getCached(key: string) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() - v.ts > v.ttl * 1000) { cache.delete(key); return null; }
  return v.data;
}
function setCached(key: string, data: any, ttl = 30) { cache.set(key, { ts: Date.now(), ttl, data }); }

function selectProvidersForTask(task: ModelCallOptions['task'], hints?: ModelCallOptions['preferredProviders']): ModelProvider[] {
  const defaults: Record<string, ModelProvider[]> = {
    chat: ['openrouter', 'groq', 'huggingface', 'together', 'ollama', 'mistral'],
    embed: ['openrouter', 'huggingface', 'local'],
    image: ['pollinations', 'huggingface', 'together'],
    code: ['openrouter', 'together', 'huggingface'],
    summarize: ['openrouter', 'groq', 'huggingface'],
    translate: ['openrouter', 'huggingface', 'local'],
  };
  const list = (defaults[task] || defaults['chat']).slice();
  if (hints && hints.length) {
    const unique = Array.from(new Set([...hints, ...list]));
    return unique as ModelProvider[];
  }
  return list;
}

// Generic HTTP adapter: provider endpoints and keys are provided via env variables.
// For browser builds, env variables must be prefixed with VITE_ to be available at build time.
async function callProviderHttp(providerName: string, options: ModelCallOptions): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    // Provider url and key env var names: VITE_PROVIDER_<NAME>_URL, VITE_PROVIDER_<NAME>_KEY
    const upper = providerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const url = (import.meta.env as any)[`VITE_PROVIDER_${upper}_URL`];
    const key = (import.meta.env as any)[`VITE_PROVIDER_${upper}_KEY`];

    if (!url) return { ok: false, error: `Provider ${providerName} not configured (no URL)` };

    const body = {
      task: options.task,
      prompt: options.prompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['Authorization'] = `Bearer ${key}`;

    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };
    const json = await resp.json();
    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, error: err.message || 'network error' };
  }
}

// High-level router that tries providers in order and returns first successful result.
export async function routerCall(options: ModelCallOptions): Promise<any> {
  const cacheKey = `${options.task}:${options.prompt}:${options.maxTokens || 0}:${options.temperature || 0}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const providers = selectProvidersForTask(options.task, options.preferredProviders);

  for (const p of providers) {
    // allow mapping aliases like 'pollinations' to an HTTP adapter
    const providerId = p as string;
    const res = await callProviderHttp(providerId, options);
    if (res.ok) {
      setCached(cacheKey, res.data, 20);
      return res.data;
    }
    // otherwise continue to next provider
  }

  return { error: 'All providers failed or none configured' };
}

export async function chat(prompt: string, opts: Partial<ModelCallOptions> = {}) {
  return routerCall({ task: 'chat', prompt, ...opts });
}

export async function generateImage(prompt: string, opts: Partial<ModelCallOptions> = {}) {
  return routerCall({ task: 'image', prompt, ...opts });
}
