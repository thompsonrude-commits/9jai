// aiRouter.ts — provider-aware routing with explicit fallback behavior.
export type ModelProvider = 'grok' | 'groq' | 'ollama' | 'browser' | 'local';

export interface ModelCallOptions {
  task: 'chat' | 'embed' | 'image' | 'code' | 'summarize' | 'translate';
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  preferredProviders?: ModelProvider[];
}

const cache = new Map<string, { ts: number; ttl: number; data: any }>();

function getCached(key: string) {
  const value = cache.get(key);
  if (!value) return null;
  if (Date.now() - value.ts > value.ttl * 1000) {
    cache.delete(key);
    return null;
  }
  return value.data;
}

function setCached(key: string, data: any, ttl = 30) {
  cache.set(key, { ts: Date.now(), ttl, data });
}

export function selectProvidersForTask(task: ModelCallOptions['task'], hints?: ModelCallOptions['preferredProviders']): ModelProvider[] {
  const defaultOrder: ModelProvider[] = ['grok', 'groq', 'ollama', 'local'];

  const normalizedHints = Array.from(new Set((hints ?? []).filter(Boolean))) as ModelProvider[];
  const preferredByTask: Record<ModelCallOptions['task'], ModelProvider[]> = {
    chat: ['grok', 'groq', 'ollama', 'local'],
    embed: ['grok', 'groq', 'local'],
    image: ['browser', 'grok', 'groq', 'local'],
    code: ['groq', 'grok', 'ollama', 'local'],
    summarize: ['grok', 'groq', 'local'],
    translate: ['groq', 'grok', 'local'],
  };

  const order = Array.from(new Set([...normalizedHints, ...preferredByTask[task], ...defaultOrder]));
  return order.filter((provider) => provider !== 'browser' || typeof window !== 'undefined');
}

async function tryBackendRoute(task: ModelCallOptions['task'], options: ModelCallOptions): Promise<any | null> {
  const endpoints = [
    task === 'image' ? '/api/v1/image/generate' : '/api/v1/chat',
    task === 'image' ? '/api/ai/image' : '/api/ai/chat',
  ];

  const requestBody = task === 'image'
    ? { prompt: options.prompt, preferredProviders: options.preferredProviders }
    : {
        task: options.task,
        messages: [{ role: 'user', content: options.prompt }],
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        preferredProviders: options.preferredProviders,
      };

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) continue;
      const data = await response.json();
      if (data && (data.text || data.imageUrl || data.outputUrl || data.provider)) {
        return data;
      }
    } catch {
      // Try the next candidate route.
    }
  }

  return null;
}

export async function routerCall(options: ModelCallOptions): Promise<any> {
  const cacheKey = `${options.task}:${options.prompt}:${options.maxTokens || 0}:${options.temperature || 0}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const providers = selectProvidersForTask(options.task, options.preferredProviders);
  const selectedProviders: ModelProvider[] = providers.length ? providers : ['local'];

  const backendResponse = await tryBackendRoute(options.task, { ...options, preferredProviders: selectedProviders });
  if (backendResponse) {
    setCached(cacheKey, { ok: true, provider: backendResponse.provider || selectedProviders[0], data: backendResponse }, 30);
    return { ok: true, provider: backendResponse.provider || selectedProviders[0], data: backendResponse };
  }

  const fallback = {
    ok: true,
    provider: 'local',
    data: {
      text: 'Local fallback mode is active. No live provider responded for this request.',
      provider: 'local',
      model: '9jai-local',
      latencyMs: 0,
      fromFallback: true,
      error: 'No live provider responded; fallback mode is active.',
    },
  };

  setCached(cacheKey, fallback.data, 20);
  return fallback.data;
}

export async function chat(prompt: string, opts: Partial<ModelCallOptions> = {}) {
  return routerCall({ task: 'chat', prompt, ...opts });
}

export async function generateImage(prompt: string, opts: Partial<ModelCallOptions> = {}) {
  return routerCall({ task: 'image', prompt, ...opts });
}
