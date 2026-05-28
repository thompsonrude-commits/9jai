"use strict";
/**
 * Groq provider — ultra-fast inference (Llama, Gemma, Mixtral)
 * https://console.groq.com/docs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROQ_MODELS = exports.GROQ_KEY = void 0;
exports.groqChat = groqChat;
exports.groqStream = groqStream;
exports.groqChatWithFallback = groqChatWithFallback;
exports.groqTranscribe = groqTranscribe;
const params_1 = require("firebase-functions/params");
exports.GROQ_KEY = (0, params_1.defineSecret)('GROQ_KEY');
const BASE_URL = 'https://api.groq.com/openai/v1';
exports.GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
];
// ── Non-streaming chat ─────────────────────────────────────────────────────
async function groqChat(messages, model = exports.GROQ_MODELS[0], temperature = 0.7, maxTokens = 2048) {
    const key = exports.GROQ_KEY.value();
    if (!key)
        throw new Error('GROQ_KEY secret not configured');
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
        throw new Error(`Groq ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data.usage?.total_tokens;
    return { text, model, tokensUsed };
}
// ── Streaming chat ─────────────────────────────────────────────────────────
async function groqStream(messages, model = exports.GROQ_MODELS[0], temperature = 0.7, maxTokens = 2048) {
    const key = exports.GROQ_KEY.value();
    if (!key)
        throw new Error('GROQ_KEY secret not configured');
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
            stream: true,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq stream ${res.status}: ${err.slice(0, 200)}`);
    }
    if (!res.body)
        throw new Error('Groq: no response body');
    return res.body;
}
// ── With model fallback ────────────────────────────────────────────────────
async function groqChatWithFallback(messages, temperature = 0.7, maxTokens = 2048) {
    let lastError = null;
    for (const model of exports.GROQ_MODELS) {
        try {
            const result = await groqChat(messages, model, temperature, maxTokens);
            if (result.text)
                return result;
        }
        catch (err) {
            lastError = err;
            console.warn(`[Groq] Model ${model} failed: ${err.message}`);
            if (err.message.includes('401') || err.message.includes('403'))
                throw err;
            continue;
        }
    }
    throw lastError ?? new Error('All Groq models exhausted');
}
// ── Whisper transcription ──────────────────────────────────────────────────
async function groqTranscribe(audioBuffer, mimeType = 'audio/webm', language = '') {
    const key = exports.GROQ_KEY.value();
    if (!key)
        throw new Error('GROQ_KEY secret not configured');
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, 'recording.webm');
    formData.append('model', 'whisper-large-v3');
    if (language)
        formData.append('language', language);
    formData.append('response_format', 'json');
    formData.append('temperature', '0');
    const res = await fetch(`${BASE_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}` },
        body: formData,
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq Whisper ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return (data.text ?? '').trim();
}
//# sourceMappingURL=groq.js.map