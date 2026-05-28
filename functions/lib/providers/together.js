"use strict";
/**
 * Together AI provider — fast open-source models + image generation
 * https://docs.together.ai
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOGETHER_IMAGE_MODELS = exports.TOGETHER_CHAT_MODELS = exports.TOGETHER_KEY = void 0;
exports.togetherChat = togetherChat;
exports.togetherImage = togetherImage;
const params_1 = require("firebase-functions/params");
exports.TOGETHER_KEY = (0, params_1.defineSecret)('TOGETHER_KEY');
const BASE_URL = 'https://api.together.xyz/v1';
exports.TOGETHER_CHAT_MODELS = [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'Qwen/Qwen2.5-72B-Instruct-Turbo',
];
exports.TOGETHER_IMAGE_MODELS = [
    'black-forest-labs/FLUX.1-schnell-Free',
    'stabilityai/stable-diffusion-xl-base-1.0',
];
// ── Chat ───────────────────────────────────────────────────────────────────
async function togetherChat(messages, model = exports.TOGETHER_CHAT_MODELS[0], temperature = 0.7, maxTokens = 2048) {
    const key = exports.TOGETHER_KEY.value();
    if (!key)
        throw new Error('TOGETHER_KEY secret not configured');
    const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Together ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data.usage?.total_tokens;
    return { text, model, tokensUsed };
}
// ── Image generation ───────────────────────────────────────────────────────
async function togetherImage(prompt, model = exports.TOGETHER_IMAGE_MODELS[0]) {
    const key = exports.TOGETHER_KEY.value();
    if (!key)
        throw new Error('TOGETHER_KEY secret not configured');
    const res = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model,
            prompt,
            width: 1024,
            height: 1024,
            steps: 4,
            n: 1,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Together image ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const imageUrl = data?.data?.[0]?.url ?? data?.output?.choices?.[0]?.image_base64;
    if (!imageUrl)
        throw new Error('Together: no image in response');
    return { imageUrl, model };
}
//# sourceMappingURL=together.js.map