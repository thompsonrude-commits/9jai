"use strict";
/**
 * Mistral AI provider
 * https://docs.mistral.ai
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MISTRAL_MODELS = exports.MISTRAL_KEY = void 0;
exports.mistralChat = mistralChat;
const params_1 = require("firebase-functions/params");
exports.MISTRAL_KEY = (0, params_1.defineSecret)('MISTRAL_KEY');
const BASE_URL = 'https://api.mistral.ai/v1';
exports.MISTRAL_MODELS = [
    'mistral-small-latest',
    'mistral-medium-latest',
    'open-mistral-7b',
    'open-mixtral-8x7b',
];
async function mistralChat(messages, model = exports.MISTRAL_MODELS[0], temperature = 0.7, maxTokens = 2048) {
    const key = exports.MISTRAL_KEY.value();
    if (!key)
        throw new Error('MISTRAL_KEY secret not configured');
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
        throw new Error(`Mistral ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data.usage?.total_tokens;
    return { text, model, tokensUsed };
}
//# sourceMappingURL=mistral.js.map