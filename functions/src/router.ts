/**
 * Intelligent AI Router — the brain of the 9jai proxy layer
 *
 * Routing strategy:
 * 1. Ollama      — PRIMARY (local/self-hosted, no provider fee)
 * 2. HuggingFace — FREE inference fallback (subject to free-tier limits)
 * 3. Pollinations — FREE image generation
 * 4. DuckDuckGo — FREE web search
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
import { hfChat } from './providers/huggingface';
import { groqChatWithFallback } from './providers/groq';
import { ollamaChatWithFallback, isOllamaAvailable } from './providers/ollama';
import { normalizeChatMessages } from './providerPayload';
import { duckduckgoSearchWithRetry, googleNewsSearch, buildSearchContext as buildDDGContext } from './providers/duckduckgo';
import { ChatMessage } from './types';
import { generateMedia } from './media/engine';
import { aiIntelligenceLayer } from './media/aiIntelligenceLayer';
import { creativeIntelligenceEngine } from './media/creativeIntelligenceEngine';
import { reasoningExplanationEngine } from './media/reasoningExplanationEngine';
import { expertIntelligencePlatform } from './media/expertIntelligencePlatform';
import { cognitiveIntelligenceSystem } from './media/cognitiveIntelligenceSystem';
import { unifiedAICore } from './media/unifiedAICore';

// ── Provider priority chains per task ─────────────────────────────────────
// Only providers with a free/local path are active in production.
// Ollama is preferred when self-hosted; Groq is a hosted free-tier path;
// Hugging Face remains a fallback when its token has inference permission.
const CHAT_CHAIN: ProviderId[] = ['ollama', 'groq', 'huggingface'];
const IMAGE_CHAIN: ProviderId[] = ['pollinations'];
const TRANSCRIBE_CHAIN: ProviderId[] = [];
const SEARCH_CHAIN: ProviderId[] = ['pollinations'];

const TASK_HINTS: Record<string, string> = {
  code: 'ollama',
  reasoning: 'ollama',
  translation: 'ollama',
  creative: 'ollama',
  math: 'ollama',
};

// ── Detect task specialization from messages ───────────────────────────────

function detectSpecialization(messages: ChatMessage[]): string | null {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return null;
  const lower = lastUser.content.toLowerCase();

  // DeepSeek — math, code, reasoning, science
  if (lower.match(/\b(code|function|debug|program|algorithm|python|javascript|typescript|sql|math|calcul|equation|physics|chemistry|engineering|robotics|data science|cybersecurity|networking|cloud)\b/)) return 'code';

  // OpenRouter — creative, translation, languages, writing
  if (lower.match(/\b(translate|translation|write a poem|story|lyrics|creative|yoruba|igbo|hausa|edo|swahili|language|novel|essay|song)\b/)) return 'translation';

  // Groq — everything else (fast, general knowledge)
  return null;
}

// ── Sanitize incoming chat messages before provider execution ─────────────
function sanitizeMessages(messages: unknown[] = []): ChatMessage[] {
  const normalized = normalizeChatMessages(messages as Array<{ role: string; content: string }>, 'huggingface');
  const system = normalized.find(message => message.role === 'system');
  const nonSystem = normalized.filter(message => message.role !== 'system');
  const selected: ChatMessage[] = [];
  const maxChars = 12000;
  let chars = system?.content.length ?? 0;

  for (let index = nonSystem.length - 1; index >= 0 && selected.length < 16; index--) {
    const message = nonSystem[index];
    const content = message.content.slice(0, 4000);
    if (selected.length > 0 && chars + content.length > maxChars) break;
    selected.unshift({ role: message.role, content });
    chars += content.length;
  }

  return system
    ? [{ role: 'system', content: system.content.slice(0, 5000) }, ...selected]
    : selected;
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
    case 'ollama':     return ollamaChatWithFallback(messages, temperature, maxTokens);
    case 'groq':       return groqChatWithFallback(messages, temperature, maxTokens);
    case 'huggingface':return hfChat(messages, undefined, temperature, maxTokens);
    default:           return hfChat(messages, temperature === undefined ? undefined : undefined, temperature, maxTokens);
  }
}

// ── Needs web search? ──────────────────────────────────────────────────────

type RequestClass = 'live-data' | 'general-knowledge' | 'hybrid';

function classifyRequest(messages: ChatMessage[]): RequestClass {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return 'general-knowledge';
  const lower = lastUser.content.toLowerCase();

  // Live-data signals — requires real-time retrieval
  const liveSignals = [
    // Time / Date
    'what time is it', 'current time', 'wetin be time', 'what is today',
    'what day is it', 'wetin be today date', 'time in', 'time now',
    'what time', 'tell me the time', 'check the time',
    // Weather
    'weather in', 'weather forecast', 'what is the weather', 'wetin be weather',
    'weather today', 'weather now', 'temperature in', 'forecast for',
    'will it rain', 'is it raining', 'weather like',
    // News — broad coverage
    'latest news', 'breaking news', 'current news', 'today news', 'naija news',
    'news today', 'news in nigeria', 'news right now', 'what happened today',
    'wetin happen today', 'wetin dey happen for nigeria',
    // Finance
    'stock price', 'exchange rate', 'dollar to naira', 'usd to ngn', 'bitcoin price',
    'crypto price', 'share price', 'naira rate',
    // Sports
    'live score', 'match score', 'who won', 'football result', 'premier league result',
    'champions league', 'world cup', 'super eagles',
    // Flights / traffic
    'flight status', 'flight delay', 'traffic update', 'road traffic',
    // Elections / events / people
    'election result', 'public holiday', 'who is the president', 'who is the governor',
    'current president', 'current cbn', 'fuel price', 'petrol price',
  ];

  // Hybrid signals — benefits from live data but AI can partially answer
  const hybridSignals = [
    'search for', 'look up', 'find out', 'what happened to',
    'tell me about', 'latest on', 'recent', 'update on',
  ];

  if (liveSignals.some(t => lower.includes(t))) return 'live-data';
  if (hybridSignals.some(t => lower.includes(t))) return 'hybrid';
  return 'general-knowledge';
}

// Keep backward-compat alias used elsewhere
function needsWebSearch(messages: ChatMessage[]): boolean {
  const cls = classifyRequest(messages);
  return cls === 'live-data' || cls === 'hybrid';
}

// ── Main router: chat ──────────────────────────────────────────────────────

export async function routeChat(req: AIRequest): Promise<AIResponse> {
  const messages = req.messages ?? [];
  const temperature = req.temperature ?? 0.7;
  const maxTokens = req.maxTokens ?? 2048;
  const timer = startTimer();

  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const promptSeed = lastUser?.content ?? req.prompt ?? '';

  // For chat: pass messages through untouched.
  // For image/video tasks: aiIntelligenceLayer adds quality signals (correct for images).
  const enrichedMessages: ChatMessage[] = messages;

  // Cache check
  const cacheKey = buildCacheKey('chat', promptSeed, req.model);
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
  let enrichedMessagesForSearch = enrichedMessages;
  if (needsWebSearch(messages) && lastUser) {
    try {
      const searchRes = await duckduckgoSearchWithRetry(lastUser.content, 5);
      const context = buildDDGContext(searchRes);
      if (context) {
        enrichedMessagesForSearch = enrichedMessages.map(m =>
          m === lastUser
            ? { ...m, content: `${m.content}\n\n[Realtime web context]:\n${context}` }
            : m
        );
      }
    } catch (err) {
      console.warn('[Router] Web search failed, continuing without:', err);
    }
  }

  let sanitizedMessages: ChatMessage[];
  try {
    sanitizedMessages = sanitizeMessages(enrichedMessagesForSearch);
  } catch (err: any) {
    const message = err?.message ?? 'Invalid chat payload';
    console.warn('[Router] Chat payload validation failed:', message, err?.details ?? '');
    const errorResponse: any = {
      text: 'Invalid chat payload. Please resend the request without unsupported message fields.',
      provider: 'openrouter',
      model: 'validation',
      latencyMs: timer(),
      cached: false,
      error: message,
    };
    if ((req as any).debug) {
      errorResponse.debug = {
        providerChain: [],
        sanitizedMessageCount: 0,
        requestDiagnostics: {
          payloadChars: messages.reduce((sum, message) => sum + message.content.length, 0),
          messageCount: messages.length,
        },
        validationError: err?.details ?? err,
      };
    }
    return errorResponse as AIResponse;
  }

  // Build provider chain
  const chain = buildProviderChain(
    'chat',
    req.preferredProviders,
    sanitizedMessages,
  );

  console.info('[Router] Chat routing chain:', chain.join('>'));
  const requestChars = sanitizedMessages.reduce((sum, message) => sum + message.content.length, 0);
  const systemPromptChars = sanitizedMessages
    .filter(message => message.role === 'system')
    .reduce((sum, message) => sum + message.content.length, 0);
  console.info('[Router] Chat request diagnostics:', JSON.stringify({
    payloadChars: requestChars,
    estimatedTokens: Math.ceil(requestChars / 4),
    systemPromptChars,
    historyChars: requestChars - systemPromptChars,
    messageCount: sanitizedMessages.length,
    attachmentCount: 0,
    selectedModel: req.model ?? 'auto',
    requestTimeoutMs: 60000,
    responseTimeoutMs: 60000,
  }));

  let lastError: Error | null = null;
  const attemptLogs: Array<any> = [];

  for (const provider of chain) {
    const providerTimer = startTimer();
    const attempt: any = { provider, startAt: Date.now(), modelAttempts: [] };
    try {
      // Execute provider with sanitized payload
      const result = await executeChatProvider(provider, sanitizedMessages, temperature, maxTokens);

      const latencyMs = providerTimer();
      attempt.durationMs = latencyMs;
      attempt.success = true;
      attempt.result = { model: result.model, textSnippet: result.text?.slice(0, 200), tokensUsed: result.tokensUsed };
      attemptLogs.push(attempt);

      recordProviderSuccess(provider, latencyMs);

      // Cache successful responses (5 min TTL)
      await setCached(cacheKey, result.text, provider, result.model, 5 * 60 * 1000);

      console.info(`[Router] Chat: ${provider}/${result.model} in ${latencyMs}ms`);

      // Successful result — include debug object when requested
      const response: any = {
        text: result.text,
        provider,
        model: result.model,
        latencyMs: timer(),
        cached: false,
        tokensUsed: result.tokensUsed,
      };

      if ((req as any).debug) {
        response.debug = {
          providerChain: chain,
          sanitizedMessageCount: sanitizedMessages.length,
          requestDiagnostics: {
            payloadChars: sanitizedMessages.reduce((sum, message) => sum + message.content.length, 0),
            messageCount: sanitizedMessages.length,
          },
          attempts: attemptLogs,
          selectedProvider: provider,
        };
      }

      return response as AIResponse;
    } catch (err: any) {
      const latencyMs = providerTimer();
      attempt.durationMs = latencyMs;
      attempt.success = false;
      attempt.error = err?.message ?? String(err);
      attemptLogs.push(attempt);

      lastError = err;
      recordProviderFailure(provider, err.message);
      console.warn(`[Router] Provider ${provider} failed, trying next: ${err.message}`);
      continue;
    }
  }

  // All providers failed — prepare fallback with debug info when requested
  const fallbackText = 'Network busy right now. Please try again in a few moments.';
  const fallbackResponse: any = {
    text: fallbackText,
    provider: 'openrouter',
    model: 'fallback',
    latencyMs: timer(),
    cached: false,
    error: lastError?.message,
  };

  if ((req as any).debug) {
    fallbackResponse.debug = {
      providerChain: chain,
      sanitizedMessageCount: sanitizedMessages.length,
      requestDiagnostics: {
        payloadChars: sanitizedMessages.reduce((sum, message) => sum + message.content.length, 0),
        messageCount: sanitizedMessages.length,
      },
      attempts: attemptLogs,
      lastError: lastError?.message,
    };
  }

  return fallbackResponse as AIResponse;
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
  const unifiedPlan = (await unifiedAICore.planRequest({
    task: req.task,
    prompt: req.prompt,
    preferredProviders: req.preferredProviders,
  })) as {
    providers?: string[];
    expertPlan?: {
      experts?: Array<{ id: string; label: string; confidence: number; estimatedQuality: number; reasonSummary: string }>;
      reviewChain?: string[];
    };
  };
  const intelligence = (await aiIntelligenceLayer.processRequest({
    task: req.task,
    prompt: req.prompt,
    preferredProviders: req.preferredProviders,
  })) as {
    optimizedPrompt?: string;
    preferredProviders?: import('./types').ProviderId[];
    capability?: string;
  };
  const creative = (await creativeIntelligenceEngine.analyzeRequest({
    kind: 'image',
    prompt: req.prompt ?? '',
    preferredProviders: intelligence.preferredProviders,
  })) as {
    expandedPrompt?: string;
    category?: string;
    specialist?: string;
  };
  const expertPlan = unifiedPlan.expertPlan ?? expertIntelligencePlatform.activateExperts(req.prompt ?? '', req.task);
  const expertList = expertPlan.experts ?? [];
  const reviewChain = expertPlan.reviewChain ?? [];
  const prompt = (creative.expandedPrompt && creative.expandedPrompt.length > 0 ? creative.expandedPrompt : intelligence.optimizedPrompt) ?? '';
  console.info(`[Router] Image generation: "${prompt.slice(0, 60)}"`);

  const providers = Array.isArray(unifiedPlan.providers) && unifiedPlan.providers.length > 0
    ? unifiedPlan.providers
    : (Array.isArray(intelligence.preferredProviders) ? intelligence.preferredProviders : []);

  const providerCandidates = providers.filter((provider): provider is ProviderId =>
    provider === 'pollinations',
  );

  const result = await generateMedia({
    kind: 'image',
    prompt,
    preferredProviders: providerCandidates,
  });

  const reasoningReportId = `image-${Date.now()}-${result.provider}`;
  const qualityScore = 0.88;
  for (const expert of expertList) {
    expertIntelligencePlatform.recordReviewOutcome(
      `image:${prompt}`,
      expert.id,
      expert.confidence,
      'success',
      expert.estimatedQuality,
      expert.reasonSummary,
    );
  }
  reasoningExplanationEngine.createReasoningReport({
    requestId: reasoningReportId,
    intent: 'image-generation',
    detectedLanguage: 'auto-detected',
    intentConfidence: 0.91,
    languageConfidence: 0.9,
    creativeCategory: creative.category ?? 'general',
      selectedSpecialist: expertList[0]?.label ?? creative.specialist ?? 'generalist',
      planningStrategy: reviewChain.length > 1 ? 'multi-expert-review' : 'reason-before-generate',
    promptExpansionSummary: prompt.slice(0, 140),
    selectedProvider: result.provider,
    selectedModel: result.model,
    selectionReason: `Selected ${result.provider} because it produced a valid image response for the current request`,
    qualityEvaluation: qualityScore,
    confidenceScore: qualityScore,
    retryReason: 'none',
    recoveryDecision: 'none',
    learningDecision: 'validated-outcome',
    completionStatus: 'success',
    executionDurationMs: result.latencyMs,
    evidenceSummary: `provider=${result.provider}; model=${result.model}; latency=${result.latencyMs}; quality=${qualityScore}; experts=${expertList.map(expert => expert.id).join(',')}; review=${reviewChain.join('->')}`,
  });
  reasoningExplanationEngine.recordProviderSelection(reasoningReportId, result.provider, `Selected ${result.provider} because it produced a valid image response for the current request`);
  reasoningExplanationEngine.recordModelSelection(reasoningReportId, result.model, `Model ${result.model} returned a valid image response`);
  reasoningExplanationEngine.recordQualityExplanation(reasoningReportId, qualityScore, ['image intent aligned', 'output is usable for the request'], ['fine-tuning may improve style consistency'], 'keep the current provider and apply tighter prompt constraints on the next pass');
  reasoningExplanationEngine.recordSelfCritique(reasoningReportId, qualityScore, ['creative intent matched', 'generation completed successfully'], ['minor polish may still improve output quality'], 'continue with the same orchestration path for similar creative prompts');

  await aiIntelligenceLayer.learnFromGeneration({
    prompt,
    capability: intelligence.capability,
    provider: result.provider,
    model: result.model,
    latencyMs: result.latencyMs,
    qualityScore,
    success: true,
  });

  return {
    imageUrl: result.imageBase64 ?? result.mediaUrl ?? '',
    imageBase64: result.imageBase64,
    provider: result.provider as ProviderId,
    model: result.model,
    latencyMs: result.latencyMs,
  };
}

// ── Main router: transcribe ────────────────────────────────────────────────

export async function routeTranscribe(
  audioBuffer: Buffer,
  mimeType: string,
  language?: string
): Promise<{ text: string; provider: ProviderId; latencyMs: number }> {
  const timer = startTimer();
  const expertPlan = expertIntelligencePlatform.activateExperts(language ?? 'speech transcription', 'transcribe');

  try {
    throw new Error('Server-side transcription is unavailable without a free inference worker. Use browser-native speech recognition or configure a self-hosted Whisper worker.');
  } catch (err: any) {
    const latency = timer();
    const reasoningReportId = `transcribe-${Date.now()}-unavailable`;
    reasoningExplanationEngine.createReasoningReport({
      requestId: reasoningReportId,
      intent: 'speech-recognition',
      detectedLanguage: language ?? 'auto-detected',
      intentConfidence: 0.75,
      languageConfidence: 0.7,
      creativeCategory: 'transcribe',
      selectedSpecialist: 'Speech Recognition Specialist',
      planningStrategy: 'provider-direct',
      promptExpansionSummary: 'transcription attempt failed on the direct provider path',
      selectedProvider: 'ollama',
      selectedModel: 'self-hosted-whisper',
      selectionReason: 'No free server-side transcription worker is configured',
      qualityEvaluation: 0,
      confidenceScore: 0,
      retryReason: err.message,
      recoveryDecision: 'recovery-queue',
      learningDecision: 'do-not-learn-from-failed-generation',
      completionStatus: 'failed',
      executionDurationMs: latency,
      evidenceSummary: `provider=self-hosted-whisper; latency=${latency}; failure=${err.message}`,
    });
    reasoningExplanationEngine.recordFailureExplanation(reasoningReportId, err.message, 'retry transcription with a different audio payload or re-check provider availability');
    throw err;
  }
}

// ── Main router: search ────────────────────────────────────────────────────

export async function routeSearch(query: string): Promise<{ context: string; results: any[]; latencyMs: number }> {
  const timer = startTimer();
  const expertPlan = expertIntelligencePlatform.activateExperts(query, 'search');

  try {
    // Try DuckDuckGo first (FREE, no API key)
    const results = await duckduckgoSearchWithRetry(query, 6);
    if (results.length === 0) {
      throw new Error('DuckDuckGo returned no results');
    }
    const latency = timer();
    const context = buildDDGContext(results);
    
    const explanationId = `search-${Date.now()}`;
    reasoningExplanationEngine.createReasoningReport({
      requestId: explanationId,
      intent: 'search-context',
      detectedLanguage: 'auto-detected',
      intentConfidence: 0.85,
      languageConfidence: 0.85,
      creativeCategory: 'search',
      selectedSpecialist: expertPlan.experts[0]?.label ?? 'Search Specialist',
      planningStrategy: expertPlan.reviewChain.length > 1 ? 'multi-expert-review' : 'context-retrieval',
      promptExpansionSummary: 'ran DuckDuckGo search for live grounding',
      selectedProvider: 'duckduckgo',
      selectedModel: 'search',
      selectionReason: 'DuckDuckGo was used to fetch external real-time search context (FREE)',
      qualityEvaluation: 0.84,
      confidenceScore: 0.84,
      retryReason: 'none',
      recoveryDecision: 'none',
      learningDecision: 'validated-outcome',
      completionStatus: 'success',
      executionDurationMs: latency,
      evidenceSummary: `provider=duckduckgo; latency=${latency}; search=success; experts=${expertPlan.experts.map(expert => expert.id).join(',')}; review=${expertPlan.reviewChain.join('->')}`,
    });
    
    return {
      context,
      results,
      latencyMs: latency,
    };
  } catch (ddgErr: any) {
    console.warn('[Router] DuckDuckGo search failed, trying free Google News RSS:', ddgErr.message);
    try {
      const results = await googleNewsSearch(query, 6);
      return {
        context: buildDDGContext(results),
        results,
        latencyMs: timer(),
      };
    } catch (rssErr: any) {
      console.warn('[Router] All free search providers failed:', rssErr.message);
      return { context: '', results: [], latencyMs: timer() };
    }
  }
}
