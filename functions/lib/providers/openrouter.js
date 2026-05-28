"use strict";
/**
 * OpenRouter provider — PRIMARY production provider
 * Routes to 200+ models via a single API
 * https://openrouter.ai/docs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPENROUTER_MODELS = exports.OPENROUTER_KEY = void 0;
exports.openRouterChat = openRouterChat;
exports.openRouterStream = openRouterStream;
exports.openRouterChatWithFallback = openRouterChatWithFallback;
exports.openRouterImage = openRouterImage;
const params_1 = require("firebase-functions/params");
exports.OPENROUTER_KEY = (0, params_1.defineSecret)('OPENROUTER_KEY');
const BASE_URL = 'https://openrouter.ai/api/v1';
const SITE_URL = 'https://9jai.web.app';
const SITE_NAME = '9jai African AI';
// Model priority list — best free/cheap models first
exports.OPENROUTER_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-3-27b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'deepseek/deepseek-r1:free',
];
// ── Non-streaming chat ─────────────────────────────────────────────────────
async function openRouterChat(messages, model = exports.OPENROUTER_MODELS[0], temperature = 0.7, maxTokens = 2048) {
    const key = exports.OPENROUTER_KEY.value();
    if (!key)
        throw new Error('OPENROUTER_KEY secret not configured');
    const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': SITE_URL,
            'X-Title': SITE_NAME,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: false,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data.usage?.total_tokens;
    const usedModel = data.model ?? model;
    return { text, model: usedModel, tokensUsed };
}
// ── Streaming chat — returns a ReadableStream ──────────────────────────────
async function openRouterStream(messages, model = exports.OPENROUTER_MODELS[0], temperature = 0.7, maxTokens = 2048) {
    const key = exports.OPENROUTER_KEY.value();
    if (!key)
        throw new Error('OPENROUTER_KEY secret not configured');
    const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': SITE_URL,
            'X-Title': SITE_NAME,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter stream ${res.status}: ${err.slice(0, 200)}`);
    }
    if (!res.body)
        throw new Error('OpenRouter: no response body');
    return res.body;
}
// ── Model fallback — tries each model until one works ─────────────────────
async function openRouterChatWithFallback(messages, temperature = 0.7, maxTokens = 2048) {
    let lastError = null;
    for (const model of exports.OPENROUTER_MODELS) {
        try {
            const result = await openRouterChat(messages, model, temperature, maxTokens);
            if (result.text)
                return result;
        }
        catch (err) {
            lastError = err;
            console.warn(`[OpenRouter] Model ${model} failed: ${err.message}`);
            // If rate limited (429), try next model immediately
            // If server error (5xx), try next model
            // If auth error (401/403), stop trying
            if (err.message.includes('401') || err.message.includes('403')) {
                throw err;
            }
            continue;
        }
    }
    throw lastError ?? new Error('All OpenRouter models exhausted');
}
// ── Image generation via OpenRouter ───────────────────────────────────────
async function openRouterImage(prompt) {
    const key = exports.OPENROUTER_KEY.value();
    if (!key)
        throw new Error('OPENROUTER_KEY secret not configured');
    const res = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': SITE_URL,
            'X-Title': SITE_NAME,
        },
        body: JSON.stringify({
            model: 'openai/dall-e-3',
            prompt,
            size: '1024x1024',
            n: 1,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter image ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const imageUrl = data?.data?.[0]?.url ?? data?.output?.[0]?.url;
    if (!imageUrl)
        throw new Error('OpenRouter: no image URL in response');
    return { imageUrl, model: 'openai/dall-e-3' };
}
//# sourceMappingURL=openrouter.js.map