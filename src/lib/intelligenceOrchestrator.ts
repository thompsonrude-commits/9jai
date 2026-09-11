export type OrchestratorTask = 'chat' | 'search' | 'code' | 'vision' | 'document' | 'image' | 'speech' | 'reasoning';

export type ProviderStatus =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'MODEL_NOT_FOUND'
  | 'BILLING_REQUIRED'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'DISABLED';

export interface ProviderCapabilityRecord {
  provider: 'grok' | 'groq' | 'ollama' | 'local';
  model: string;
  capabilities: string[];
  status: ProviderStatus;
  latency: number;
  cost: number;
  contextWindow: number;
  supportedLanguages: string[];
  modalities: string[];
  priority: number;
}

export interface OrchestrationPlan {
  task: OrchestratorTask;
  needsWebSearch: boolean;
  needsRag: boolean;
  needsMemory: boolean;
  needsTools: boolean;
  needsVerification: boolean;
  needsFallback: boolean;
  conversationLanguage: string;
  providerOrder: string[];
  notes: string[];
}

const providerCatalog: Record<string, ProviderCapabilityRecord> = {
  grok: {
    provider: 'grok',
    model: 'grok-2-latest',
    capabilities: ['chat', 'reasoning', 'search'],
    status: 'READY',
    latency: 850,
    cost: 4,
    contextWindow: 128000,
    supportedLanguages: ['en', 'pcm', 'yo', 'ig', 'ha', 'fr', 'es'],
    modalities: ['text'],
    priority: 1,
  },
  groq: {
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    capabilities: ['chat', 'reasoning', 'code'],
    status: 'READY',
    latency: 700,
    cost: 3,
    contextWindow: 128000,
    supportedLanguages: ['en', 'pcm', 'yo', 'ig', 'ha', 'fr', 'es'],
    modalities: ['text'],
    priority: 2,
  },
  ollama: {
    provider: 'ollama',
    model: 'llama3.1',
    capabilities: ['chat', 'code', 'vision'],
    status: 'UNAVAILABLE',
    latency: 1200,
    cost: 1,
    contextWindow: 32768,
    supportedLanguages: ['en', 'pcm', 'yo', 'ig', 'ha', 'fr', 'es'],
    modalities: ['text', 'vision'],
    priority: 3,
  },
  local: {
    provider: 'local',
    model: '9jai-local',
    capabilities: ['chat', 'fallback'],
    status: 'READY',
    latency: 0,
    cost: 0,
    contextWindow: 4000,
    supportedLanguages: ['en', 'pcm', 'yo', 'ig', 'ha', 'fr', 'es'],
    modalities: ['text'],
    priority: 99,
  },
};

const JUDGE_PHRASES = {
  requiresSearch: /(latest|current|today|news|recent|this week|this month|price|stock|currency|policy|regulation|launch|space|sports|weather|breaking|right now|as of)/i,
  requiresReasoning: /(compare|analyze|evaluate|plan|design|strategy|math|equation|calculate|debug|reason|why|how does|pros and cons)/i,
  requiresCode: /(code|python|javascript|typescript|debug|refactor|test|patch|regex|api|sql|bash)/i,
  requiresVision: /(image|photo|screenshot|diagram|chart|look at|describe this image|what is in this picture)/i,
  requiresDocument: /(pdf|docx|excel|csv|document|upload|analyze this file|summarize this document)/i,
  requiresMedical: /(symptom|diagnosis|medicine|drug|treatment|clinical|medical|health)/i,
  requiresEducation: /(teach|learn|lesson|explain|study|tutor|quiz)/i,
};

export function getProviderCatalog(): Record<string, ProviderCapabilityRecord> {
  return { ...providerCatalog };
}

export function selectProvidersForTask(task: OrchestratorTask, userInput = '', conversationLanguage = 'pcm'): string[] {
  const normalized = task || 'chat';
  const input = (userInput || '').toLowerCase();
  const hasFreshnessNeeds = JUDGE_PHRASES.requiresSearch.test(input);
  const hasReasoningNeeds = JUDGE_PHRASES.requiresReasoning.test(input);
  const isCodeTask = JUDGE_PHRASES.requiresCode.test(input);
  const isVisionTask = JUDGE_PHRASES.requiresVision.test(input);
  const isDocumentTask = JUDGE_PHRASES.requiresDocument.test(input);

  const preferred: string[] = [];

  if (normalized === 'search' || hasFreshnessNeeds) preferred.push('grok', 'groq');
  else if (isDocumentTask) preferred.push('groq', 'grok');
  else if (isVisionTask) preferred.push('grok', 'ollama', 'groq');
  else if (isCodeTask) preferred.push('groq', 'grok', 'ollama');
  else if (hasReasoningNeeds) preferred.push('grok', 'groq');
  else preferred.push('grok', 'groq', 'ollama');

  if (conversationLanguage !== 'en' && conversationLanguage) {
    preferred.push('groq');
  }

  const order = Array.from(new Set([...preferred, 'grok', 'groq', 'ollama', 'local']))
    .filter((provider) => providerCatalog[provider]?.status !== 'DISABLED')
    .map((provider) => provider)
    .slice(0, 4);

  return order;
}

export function buildRequestPlan(input: string, conversationLanguage = 'pcm'): OrchestrationPlan {
  const text = input || '';
  const needsWebSearch = JUDGE_PHRASES.requiresSearch.test(text);
  const needsRag = /\b(pdf|document|knowledge|context|upload|reference|research|article|book)\b/i.test(text);
  const needsMemory = /\b(remember|save|retain|user preference|my name|my language|style|format)\b/i.test(text);
  const needsTools = /\b(calculator|search|api|database|csv|excel|json|python|code|document|email|web)\b/i.test(text);
  const needsVerification = /\b(calculation|prove|verify|compare|check|confirm|engineering|medical|financial|legal)\b/i.test(text);
  const needsFallback = true;

  const task: OrchestratorTask = needsWebSearch
    ? 'search'
    : JUDGE_PHRASES.requiresVision.test(text)
      ? 'vision'
      : JUDGE_PHRASES.requiresCode.test(text)
        ? 'code'
        : JUDGE_PHRASES.requiresMedical.test(text)
          ? 'reasoning'
          : 'chat';

  return {
    task,
    needsWebSearch,
    needsRag,
    needsMemory,
    needsTools,
    needsVerification,
    needsFallback,
    conversationLanguage,
    providerOrder: selectProvidersForTask(task, text, conversationLanguage),
    notes: [
      needsWebSearch ? 'freshness check required' : 'general reasoning path',
      needsMemory ? 'memory-aware response' : 'single-turn response',
      needsVerification ? 'verification step enabled' : 'no verification step required',
    ],
  };
}

export function getFriendlyFallbackMessage(task: OrchestratorTask, input: string): string {
  const summary = (input || '').trim() || 'your request';
  switch (task) {
    case 'search':
      return `I cannot verify live web information right now for “${summary}”, but I can still give a grounded explanation based on available local knowledge and recommend checking a trusted live source.`;
    case 'vision':
      return `I cannot inspect the supplied image right now for “${summary}”, but I can still help explain the likely content or guide you through a supported image-analysis flow.`;
    case 'code':
      return `I cannot run a live code analysis for “${summary}” at the moment, but I can still help with a safe, step-by-step code review strategy and sandbox-ready guidance.`;
    case 'reasoning':
      return `I cannot complete a live reasoning pass on “${summary}” right now, but I can still provide a careful, conservative explanation and flag any uncertain assumptions.`;
    default:
      return `Local fallback mode is active. I can still help with “${summary}”, but the live provider for this request is currently unavailable.`;
  }
}
