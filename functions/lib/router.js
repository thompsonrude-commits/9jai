"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRoutingDecision = makeRoutingDecision;
exports.routeChat = routeChat;
exports.routeImage = routeImage;
exports.routeTranscribe = routeTranscribe;
exports.routeSearch = routeSearch;
const logger_1 = require("./logger");
const cache_1 = require("./cache");
const openrouter_1 = require("./providers/openrouter");
const groq_1 = require("./providers/groq");
const together_1 = require("./providers/together");
const deepseek_1 = require("./providers/deepseek");
const mistral_1 = require("./providers/mistral");
const huggingface_1 = require("./providers/huggingface");
const tavily_1 = require("./providers/tavily");
const pollinations_1 = require("./providers/pollinations");
// ── Provider priority chains per task ─────────────────────────────────────
const CHAT_CHAIN = ['openrouter', 'groq', 'together', 'deepseek', 'mistral', 'huggingface'];
const IMAGE_CHAIN = ['openrouter', 'together', 'huggingface'];
const TRANSCRIBE_CHAIN = ['groq'];
const SEARCH_CHAIN = ['openrouter']; // search uses Tavily internally
// Task-specific model hints
const TASK_HINTS = {
    code: 'deepseek',
    reasoning: 'deepseek',
    translation: 'openrouter',
    creative: 'openrouter',
    math: 'deepseek',
};
// ── Detect task specialization from messages ───────────────────────────────
function detectSpecialization(messages) {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser)
        return null;
    const lower = lastUser.content.toLowerCase();
    if (lower.includes('code') || lower.includes('function') || lower.includes('debug') || lower.includes('program'))
        return 'code';
    if (lower.includes('reason') || lower.includes('analyze') || lower.includes('think step'))
        return 'reasoning';
    if (lower.includes('translate') || lower.includes('language'))
        return 'translation';
    if (lower.includes('write') || lower.includes('poem') || lower.includes('story') || lower.includes('lyrics'))
        return 'creative';
    if (lower.includes('math') || lower.includes('calculate') || lower.includes('equation'))
        return 'math';
    return null;
}
// ── Build ordered provider chain ───────────────────────────────────────────
function buildProviderChain(task, preferred, messages) {
    let base;
    switch (task) {
        case 'image':
            base = IMAGE_CHAIN;
            break;
        case 'transcribe':
            base = TRANSCRIBE_CHAIN;
            break;
        case 'search':
            base = SEARCH_CHAIN;
            break;
        default: base = CHAT_CHAIN;
    }
    // Detect specialization and promote relevant provider
    if (messages && (task === 'chat' || task === 'stream')) {
        const spec = detectSpecialization(messages);
        if (spec && TASK_HINTS[spec]) {
            const hinted = TASK_HINTS[spec];
            base = [hinted, ...base.filter(p => p !== hinted)];
        }
    }
    // Prepend preferred providers
    if (preferred && preferred.length > 0) {
        const unique = [...preferred, ...base.filter(p => !preferred.includes(p))];
        base = unique;
    }
    // Filter out unavailable providers
    return base.filter(p => (0, logger_1.isProviderAvailable)(p));
}
// ── Make routing decision ──────────────────────────────────────────────────
function makeRoutingDecision(task, preferred, messages) {
    const chain = buildProviderChain(task, preferred, messages);
    const selected = chain[0] ?? 'openrouter';
    const health = (0, logger_1.getProviderHealth)(selected);
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
async function executeChatProvider(provider, messages, temperature, maxTokens) {
    switch (provider) {
        case 'openrouter': return (0, openrouter_1.openRouterChatWithFallback)(messages, temperature, maxTokens);
        case 'groq': return (0, groq_1.groqChatWithFallback)(messages, temperature, maxTokens);
        case 'together': return (0, together_1.togetherChat)(messages, undefined, temperature, maxTokens);
        case 'deepseek': return (0, deepseek_1.deepseekChat)(messages, undefined, temperature, maxTokens);
        case 'mistral': return (0, mistral_1.mistralChat)(messages, undefined, temperature, maxTokens);
        case 'huggingface': return (0, huggingface_1.hfChat)(messages, undefined, temperature, maxTokens);
        default: return (0, openrouter_1.openRouterChatWithFallback)(messages, temperature, maxTokens);
    }
}
// ── Needs web search? ──────────────────────────────────────────────────────
function needsWebSearch(messages) {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser)
        return false;
    const lower = lastUser.content.toLowerCase();
    const triggers = [
        'latest', 'current', 'today', 'news', 'recent', '2025', '2026',
        'price', 'weather', 'stock', 'score', 'result', 'who won',
        'what happened', 'breaking', 'search', 'look up', 'find out',
    ];
    return triggers.some(t => lower.includes(t));
}
// ── Main router: chat ──────────────────────────────────────────────────────
async function routeChat(req) {
    const messages = req.messages ?? [];
    const temperature = req.temperature ?? 0.7;
    const maxTokens = req.maxTokens ?? 2048;
    const timer = (0, logger_1.startTimer)();
    // Cache check
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const cacheKey = (0, cache_1.buildCacheKey)('chat', lastUser?.content ?? '', req.model);
    const cached = await (0, cache_1.getCached)(cacheKey);
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
            const searchRes = await (0, tavily_1.tavilySearch)(lastUser.content, 5, 'basic');
            const context = (0, tavily_1.buildSearchContext)(searchRes);
            if (context) {
                enrichedMessages = messages.map(m => m === lastUser
                    ? { ...m, content: `${m.content}\n\n[Realtime web context]:\n${context}` }
                    : m);
            }
        }
        catch (err) {
            console.warn('[Router] Web search failed, continuing without:', err);
        }
    }
    // Build provider chain
    const chain = buildProviderChain('chat', req.preferredProviders, messages);
    let lastError = null;
    for (const provider of chain) {
        const providerTimer = (0, logger_1.startTimer)();
        try {
            const result = await executeChatProvider(provider, enrichedMessages, temperature, maxTokens);
            if (!result.text)
                continue;
            const latencyMs = providerTimer();
            (0, logger_1.recordProviderSuccess)(provider, latencyMs);
            // Cache successful responses (5 min TTL)
            await (0, cache_1.setCached)(cacheKey, result.text, provider, result.model, 5 * 60 * 1000);
            console.info(`[Router] Chat: ${provider}/${result.model} in ${latencyMs}ms`);
            return {
                text: result.text,
                provider,
                model: result.model,
                latencyMs: timer(),
                cached: false,
                tokensUsed: result.tokensUsed,
            };
        }
        catch (err) {
            lastError = err;
            (0, logger_1.recordProviderFailure)(provider, err.message);
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
async function routeImage(req) {
    const prompt = req.prompt ?? '';
    const timer = (0, logger_1.startTimer)();
    // ── NO CACHE for images — every generation must be unique ──────────────
    // Caching causes identical outputs for the same prompt.
    // The visual intelligence engine generates unique prompts + seeds every call.
    console.info(`[Router] Image generation: "${prompt.slice(0, 60)}"`);
    // ── STEP 1: Try Together AI (FLUX.1-schnell-Free — real AI generation) ──
    if ((0, logger_1.isProviderAvailable)('together')) {
        try {
            const result = await (0, together_1.togetherImage)(prompt);
            if (result.imageUrl) {
                (0, logger_1.recordProviderSuccess)('together', timer());
                console.info(`[Router] Image from Together AI in ${timer()}ms`);
                return { imageUrl: result.imageUrl, provider: 'together', model: result.model, latencyMs: timer() };
            }
        }
        catch (err) {
            (0, logger_1.recordProviderFailure)('together', err.message);
            console.warn(`[Router] Together AI image failed: ${err.message}`);
        }
    }
    // ── STEP 2: Pollinations AI (fetches actual bytes server-side) ─────
    try {
        const result = await (0, pollinations_1.pollinationsWithFallback)(prompt);
        if (result.imageBase64) {
            (0, logger_1.recordProviderSuccess)('pollinations', timer());
            console.info(`[Router] Image from Pollinations in ${timer()}ms | mode=${result.mode} | quality=${result.quality}`);
            return {
                imageUrl: result.url,
                imageBase64: result.imageBase64,
                provider: 'pollinations',
                model: result.model,
                latencyMs: timer(),
            };
        }
    }
    catch (err) {
        console.warn(`[Router] Pollinations failed: ${err.message}`);
    }
    // ── STEP 3: HuggingFace (if key available) ────────────────────────────────
    if ((0, logger_1.isProviderAvailable)('huggingface')) {
        try {
            const { hfImage } = await Promise.resolve().then(() => __importStar(require('./providers/huggingface')));
            const result = await hfImage(prompt);
            if (result.imageBase64) {
                (0, logger_1.recordProviderSuccess)('huggingface', timer());
                return {
                    imageUrl: result.imageBase64,
                    imageBase64: result.imageBase64,
                    provider: 'huggingface',
                    model: result.model,
                    latencyMs: timer(),
                };
            }
        }
        catch (err) {
            (0, logger_1.recordProviderFailure)('huggingface', err.message);
            console.warn(`[Router] HuggingFace image failed: ${err.message}`);
        }
    }
    // ── ABSOLUTE FALLBACK: Return Pollinations URL (browser will load it) ─────
    const { getPollinationsUrl } = await Promise.resolve().then(() => __importStar(require('./providers/pollinations')));
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
async function routeTranscribe(audioBuffer, mimeType, language) {
    const timer = (0, logger_1.startTimer)();
    try {
        const text = await (0, groq_1.groqTranscribe)(audioBuffer, mimeType, language ?? '');
        (0, logger_1.recordProviderSuccess)('groq', timer());
        return { text, provider: 'groq', latencyMs: timer() };
    }
    catch (err) {
        (0, logger_1.recordProviderFailure)('groq', err.message);
        return { text: '', provider: 'groq', latencyMs: timer() };
    }
}
// ── Main router: search ────────────────────────────────────────────────────
async function routeSearch(query) {
    const timer = (0, logger_1.startTimer)();
    try {
        const res = await (0, tavily_1.tavilySearch)(query, 6, 'advanced');
        return {
            context: (0, tavily_1.buildSearchContext)(res),
            results: res.results,
            latencyMs: timer(),
        };
    }
    catch (err) {
        console.warn('[Router] Search failed:', err.message);
        return { context: '', results: [], latencyMs: timer() };
    }
}
//# sourceMappingURL=router.js.map