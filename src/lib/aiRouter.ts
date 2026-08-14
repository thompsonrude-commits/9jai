// aiRouter.ts — local-first routing, no front-end provider secrets.
type ModelProvider = 'local' | 'proxy' | 'browser';

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

function selectProvidersForTask(_task: ModelCallOptions['task'], hints?: ModelCallOptions['preferredProviders']): ModelProvider[] {
  const defaults: ModelProvider[] = ['local', 'proxy', 'browser'];
  return hints && hints.length ? Array.from(new Set([...hints, ...defaults])) : defaults;
}

export async function routerCall(options: ModelCallOptions): Promise<any> {
  const cacheKey = `${options.task}:${options.prompt}:${options.maxTokens || 0}:${options.temperature || 0}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const providers = selectProvidersForTask(options.task, options.preferredProviders);
  for (const provider of providers) {
    if (provider === 'local') {
      const result = {
        ok: true,
        provider: 'local',
        data: { text: `Local fallback for: ${options.prompt}`.slice(0, 300) },
      };
      setCached(cacheKey, result.data, 20);
      return result.data;
    }
  }

  const fallback = { ok: true, provider: 'local', data: { text: 'Local 9JAI fallback is active.' } };
  setCached(cacheKey, fallback.data, 20);
  return fallback.data;
}

export async function chat(prompt: string, opts: Partial<ModelCallOptions> = {}) {
  return routerCall({ task: 'chat', prompt, ...opts });
}

export async function generateImage(prompt: string, opts: Partial<ModelCallOptions> = {}) {
  return routerCall({ task: 'image', prompt, ...opts });
}
