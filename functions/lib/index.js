"use strict";
/**
 * 9jai AI Super Ecosystem — Firebase Cloud Functions
 * Secure AI proxy layer — API keys NEVER reach the client
 *
 * Endpoints:
 *   POST /ai/chat        — multi-provider chat with failover
 *   POST /ai/stream      — streaming chat (SSE)
 *   POST /ai/image       — image generation with fallback
 *   POST /ai/transcribe  — Whisper audio transcription
 *   POST /ai/search      — Tavily web search
 *   GET  /ai/health      — provider health status
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
exports.aiHealth = exports.aiTTS = exports.aiSearch = exports.aiTranscribe = exports.aiImage = exports.aiStream = exports.aiChat = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const crypto = __importStar(require("crypto"));
const openrouter_1 = require("./providers/openrouter");
const groq_1 = require("./providers/groq");
const together_1 = require("./providers/together");
const huggingface_1 = require("./providers/huggingface");
const deepseek_1 = require("./providers/deepseek");
const mistral_1 = require("./providers/mistral");
const tavily_1 = require("./providers/tavily");
const googleTTS_1 = require("./providers/googleTTS");
const router_1 = require("./router");
const logger_1 = require("./logger");
const cache_1 = require("./cache");
// ── Init ───────────────────────────────────────────────────────────────────
admin.initializeApp();
// Deploy to us-central1 — lowest latency for global + African users via CDN
(0, v2_1.setGlobalOptions)({
    region: 'us-central1',
    maxInstances: 10, // free tier quota: 20 max, use 10 to stay safe
    timeoutSeconds: 60,
    memory: '256MiB', // reduced from 512MiB to stay within quota
});
// All secrets used across functions
const ALL_SECRETS = [
    openrouter_1.OPENROUTER_KEY,
    groq_1.GROQ_KEY,
    together_1.TOGETHER_KEY,
    huggingface_1.HF_KEY,
    deepseek_1.DEEPSEEK_KEY,
    mistral_1.MISTRAL_KEY,
    tavily_1.TAVILY_KEY,
    googleTTS_1.GOOGLE_TTS_KEY,
];
// ── CORS helper ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
    'https://9jai.web.app',
    'https://9jai.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    // Allow all Firebase hosting domains (supports global access including Nigeria)
];
function setCorsHeaders(req, res) {
    const origin = req.headers.origin ?? '';
    // Allow all .web.app and .firebaseapp.com domains for global access
    const allowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com') || origin.includes('localhost');
    const corsOrigin = allowed ? origin : ALLOWED_ORIGINS[0];
    res.set('Access-Control-Allow-Origin', corsOrigin);
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, X-User-Id');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Max-Age', '3600');
    res.set('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return true;
    }
    return false;
}
// ── Request ID generator ───────────────────────────────────────────────────
function genRequestId() {
    return crypto.randomBytes(8).toString('hex');
}
// ── Rate limiting (simple in-memory, per function instance) ───────────────
const rateLimitMap = new Map();
const RATE_LIMIT = 60; // requests per minute per IP
const RATE_WINDOW = 60 * 1000;
function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT)
        return false;
    entry.count++;
    return true;
}
// ── /ai/chat — non-streaming chat ─────────────────────────────────────────
exports.aiChat = (0, https_1.onRequest)({ secrets: ALL_SECRETS, cors: false }, async (req, res) => {
    if (setCorsHeaders(req, res))
        return;
    const requestId = genRequestId();
    const ip = req.ip ?? 'unknown';
    if (!checkRateLimit(ip)) {
        res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const body = req.body;
    if (!body.messages && !body.prompt) {
        res.status(400).json({ error: 'messages or prompt required' });
        return;
    }
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];
    try {
        const result = await (0, router_1.routeChat)({
            ...body,
            task: 'chat',
            userId,
            sessionId,
        });
        // Log async
        (0, logger_1.logRequest)({
            requestId,
            userId,
            sessionId,
            task: 'chat',
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
            tokensUsed: result.tokensUsed,
            cached: result.cached,
            success: !result.error,
            error: result.error,
            timestamp: Date.now(),
        }).catch(() => { });
        res.status(200).json(result);
    }
    catch (err) {
        console.error('[aiChat] Unhandled error:', err);
        res.status(500).json({ error: 'Internal server error', text: 'Something went wrong. Please try again.' });
    }
});
// ── /ai/stream — Server-Sent Events streaming ─────────────────────────────
exports.aiStream = (0, https_1.onRequest)({ secrets: ALL_SECRETS, cors: false, timeoutSeconds: 60 }, async (req, res) => {
    if (setCorsHeaders(req, res))
        return;
    const ip = req.ip ?? 'unknown';
    if (!checkRateLimit(ip)) {
        res.status(429).json({ error: 'Rate limit exceeded.' });
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const body = req.body;
    if (!body.messages && !body.prompt) {
        res.status(400).json({ error: 'messages or prompt required' });
        return;
    }
    const requestId = genRequestId();
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];
    const startTime = Date.now();
    // Set SSE headers
    res.set('Content-Type', 'text/event-stream');
    res.set('Cache-Control', 'no-cache, no-transform');
    res.set('X-Accel-Buffering', 'no'); // disable nginx buffering
    res.set('Connection', 'keep-alive');
    res.flushHeaders();
    // Helper to write SSE events
    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    try {
        // Use non-streaming route but emit chunks as SSE
        // (True streaming from providers requires HTTP/2 pass-through — use non-streaming for now)
        const result = await (0, router_1.routeChat)({
            ...body,
            task: 'chat',
            userId,
            sessionId,
        });
        // Simulate streaming by chunking the response
        const words = result.text.split(' ');
        const chunkSize = 3; // words per chunk
        for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
            sendEvent('chunk', { text: chunk });
            // Small delay to simulate streaming (helps mobile rendering)
            await new Promise(r => setTimeout(r, 15));
        }
        sendEvent('done', {
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
            cached: result.cached,
            tokensUsed: result.tokensUsed,
        });
        // Log async
        (0, logger_1.logRequest)({
            requestId,
            userId,
            sessionId,
            task: 'stream',
            provider: result.provider,
            model: result.model,
            latencyMs: Date.now() - startTime,
            tokensUsed: result.tokensUsed,
            cached: result.cached,
            success: true,
            timestamp: Date.now(),
        }).catch(() => { });
    }
    catch (err) {
        console.error('[aiStream] Error:', err);
        sendEvent('error', { message: 'Stream failed. Please try again.' });
    }
    finally {
        res.end();
    }
});
// ── /ai/image — image generation ──────────────────────────────────────────
exports.aiImage = (0, https_1.onRequest)({ secrets: ALL_SECRETS, cors: false, timeoutSeconds: 300, memory: '512MiB' }, async (req, res) => {
    if (setCorsHeaders(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { prompt, preferredProviders } = req.body;
    if (!prompt) {
        res.status(400).json({ error: 'prompt required' });
        return;
    }
    const requestId = genRequestId();
    try {
        const result = await (0, router_1.routeImage)({ task: 'image', prompt, preferredProviders });
        (0, logger_1.logRequest)({
            requestId,
            task: 'image',
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
            cached: false,
            success: true,
            timestamp: Date.now(),
        }).catch(() => { });
        // Return both URL and base64 — frontend uses base64 for instant render
        res.status(200).json({
            imageUrl: result.imageBase64 ?? result.imageUrl,
            imageBase64: result.imageBase64,
            directUrl: result.imageUrl,
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
        });
    }
    catch (err) {
        console.error('[aiImage] Error:', err);
        res.status(500).json({ error: 'Image generation failed' });
    }
});
// ── /ai/transcribe — Whisper audio transcription ──────────────────────────
exports.aiTranscribe = (0, https_1.onRequest)({ secrets: ALL_SECRETS, cors: false, timeoutSeconds: 60, memory: '256MiB' }, async (req, res) => {
    if (setCorsHeaders(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { audioBase64, mimeType, language } = req.body;
    if (!audioBase64) {
        res.status(400).json({ error: 'audioBase64 required' });
        return;
    }
    const requestId = genRequestId();
    try {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const result = await (0, router_1.routeTranscribe)(audioBuffer, mimeType ?? 'audio/webm', language);
        (0, logger_1.logRequest)({
            requestId,
            task: 'transcribe',
            provider: result.provider,
            model: 'whisper-large-v3',
            latencyMs: result.latencyMs,
            cached: false,
            success: true,
            timestamp: Date.now(),
        }).catch(() => { });
        res.status(200).json({ text: result.text, provider: result.provider });
    }
    catch (err) {
        console.error('[aiTranscribe] Error:', err);
        res.status(500).json({ error: 'Transcription failed', text: '' });
    }
});
// ── /ai/search — Tavily web search ────────────────────────────────────────
exports.aiSearch = (0, https_1.onRequest)({ secrets: ALL_SECRETS, cors: false }, async (req, res) => {
    if (setCorsHeaders(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { query } = req.body;
    if (!query) {
        res.status(400).json({ error: 'query required' });
        return;
    }
    try {
        const result = await (0, router_1.routeSearch)(query);
        res.status(200).json(result);
    }
    catch (err) {
        console.error('[aiSearch] Error:', err);
        res.status(500).json({ error: 'Search failed', context: '', results: [] });
    }
});
// ── /ai/tts — Google Cloud TTS Nigerian voices ────────────────────────────
exports.aiTTS = (0, https_1.onRequest)({ secrets: ALL_SECRETS, cors: false, timeoutSeconds: 30 }, async (req, res) => {
    if (setCorsHeaders(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { text, assistantId } = req.body;
    if (!text) {
        res.status(400).json({ error: 'text required' });
        return;
    }
    try {
        const result = await (0, googleTTS_1.synthesizeNigerianSpeech)(text, assistantId || 'nosa');
        if (!result) {
            // Google TTS not configured or failed — tell client to use browser TTS
            res.status(503).json({ error: 'TTS unavailable', fallback: true });
            return;
        }
        res.status(200).json({
            audioBase64: result.audioBase64,
            contentType: result.contentType,
            assistantId: assistantId || 'nosa',
        });
    }
    catch (err) {
        console.error('[aiTTS] Error:', err);
        res.status(500).json({ error: 'TTS failed', fallback: true });
    }
});
// ── /ai/health — provider health dashboard ────────────────────────────────
exports.aiHealth = (0, https_1.onRequest)({ secrets: ALL_SECRETS, cors: false }, async (req, res) => {
    if (setCorsHeaders(req, res))
        return;
    const snapshots = (0, logger_1.getAllHealthSnapshots)();
    const cacheStats = (0, cache_1.getMemCacheStats)();
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        providers: snapshots,
        cache: cacheStats,
        version: '2.0.0',
    });
});
//# sourceMappingURL=index.js.map