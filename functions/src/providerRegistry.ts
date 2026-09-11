import type { ProviderId } from './types';

export interface ProviderDescriptor {
  id: ProviderId;
  name: string;
  type: 'chat' | 'vision' | 'image' | 'search' | 'local';
  secretName?: string;
  capabilities: string[];
  status: 'ready' | 'not_configured' | 'unavailable' | 'degraded';
  priority: number;
  description: string;
}

export const ACTIVE_PROVIDER_REGISTRY: ProviderDescriptor[] = [
  {
    id: 'grok',
    name: 'Grok',
    type: 'chat',
    secretName: 'GROK_KEY',
    capabilities: ['reasoning', 'chat', 'tool-use'],
    status: 'not_configured',
    priority: 100,
    description: 'Primary xAI provider for general reasoning when configured and healthy.',
  },
  {
    id: 'groq',
    name: 'Groq',
    type: 'chat',
    secretName: 'GROQ_KEY',
    capabilities: ['chat', 'reasoning', 'fast-response'],
    status: 'not_configured',
    priority: 90,
    description: 'Hosted fast inference provider with backend-only credential management.',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    type: 'local',
    capabilities: ['chat', 'local', 'offline'],
    status: 'unavailable',
    priority: 70,
    description: 'Local self-hosted provider that remains available for development and fallback.',
  },
];

export function getActiveProviderRegistry(): ProviderDescriptor[] {
  return ACTIVE_PROVIDER_REGISTRY.map((provider) => ({ ...provider }));
}

export function getPrimaryProviderForTask(task: string): ProviderId {
  const normalized = task.toLowerCase();
  if (normalized.includes('vision') || normalized.includes('image')) return 'ollama';
  return 'grok';
}
