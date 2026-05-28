"use strict";
/**
 * HuggingFace Inference API provider
 * https://huggingface.co/docs/api-inference
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HF_IMAGE_MODELS = exports.HF_CHAT_MODELS = exports.HF_KEY = void 0;
exports.hfChat = hfChat;
exports.hfImage = hfImage;
const params_1 = require("firebase-functions/params");
exports.HF_KEY = (0, params_1.defineSecret)('HF_KEY');
const BASE_URL = 'https://api-inference.huggingface.co';
exports.HF_CHAT_MODELS = [
    'meta-llama/Llama-3.1-8B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'microsoft/DialoGPT-large',
];
exports.HF_IMAGE_MODELS = [
    'stabilityai/stable-diffusion-2-1',
    'runwayml/stable-diffusion-v1-5',
];
// ── Chat (text generation) ─────────────────────────────────────────────────
async function hfChat(messages, model = exports.HF_CHAT_MODELS[0], temperature = 0.7, maxTokens = 1024) {
    const key = exports.HF_KEY.value();
    if (!key)
        throw new Error('HF_KEY secret not configured');
    // Build prompt from messages
    const prompt = messages.map(m => {
        if (m.role === 'system')
            return `<|system|>\n${m.content}`;
        if (m.role === 'user')
            return `<|user|>\n${m.content}`;
        return `<|assistant|>\n${m.content}`;
    }).join('\n') + '\n<|assistant|>\n';
    const res = await fetch(`${BASE_URL}/models/${model}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: maxTokens,
                temperature,
                return_full_text: false,
                do_sample: true,
            },
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`HuggingFace ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) ?? '';
    return { text: text.trim(), model };
}
// ── Image generation ───────────────────────────────────────────────────────
async function hfImage(prompt, model = exports.HF_IMAGE_MODELS[0]) {
    const key = exports.HF_KEY.value();
    if (!key)
        throw new Error('HF_KEY secret not configured');
    const res = await fetch(`${BASE_URL}/models/${model}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ inputs: prompt }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`HuggingFace image ${res.status}: ${err.slice(0, 200)}`);
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return { imageBase64: `data:image/png;base64,${base64}`, model };
}
//# sourceMappingURL=huggingface.js.map