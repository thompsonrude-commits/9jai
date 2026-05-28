"use strict";
/**
 * DeepSeek provider — excellent reasoning + coding models
 * https://platform.deepseek.com/docs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEEPSEEK_MODELS = exports.DEEPSEEK_KEY = void 0;
exports.deepseekChat = deepseekChat;
const params_1 = require("firebase-functions/params");
exports.DEEPSEEK_KEY = (0, params_1.defineSecret)('DEEPSEEK_KEY');
const BASE_URL = 'https://api.deepseek.com/v1';
exports.DEEPSEEK_MODELS = [
    'deepseek-chat',
    'deepseek-reasoner',
];
async function deepseekChat(messages, model = exports.DEEPSEEK_MODELS[0], temperature = 0.7, maxTokens = 2048) {
    const key = exports.DEEPSEEK_KEY.value();
    if (!key)
        throw new Error('DEEPSEEK_KEY secret not configured');
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
            stream: false,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`DeepSeek ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data.usage?.total_tokens;
    return { text, model, tokensUsed };
}
//# sourceMappingURL=deepseek.js.map