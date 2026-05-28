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

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as crypto from 'crypto';

import {
  OPENROUTER_KEY,
} from './providers/openrouter';
import { GROQ_KEY } from './providers/groq';
import { TOGETHER_KEY } from './providers/together';
import { HF_KEY } from './providers/huggingface';
import { DEEPSEEK_KEY } from './providers/deepseek';
import { MISTRAL_KEY } from './providers/mistral';
import { TAVILY_KEY } from './providers/tavily';
import { GOOGLE_TTS_KEY, synthesizeNigerianSpeech } from './providers/googleTTS';

import { routeChat, routeImage, routeTranscribe, routeSearch } from './router';
import { getAllHealthSnapshots, logRequest } from './logger';
import { getMemCacheStats } from './cache';
import { AIRequest } from './types';

// ── Init ───────────────────────────────────────────────────────────────────

admin.initializeApp();

// Deploy to us-central1 — lowest latency for global + African users via CDN
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,       // free tier quota: 20 max, use 10 to stay safe
  timeoutSeconds: 60,
  memory: '256MiB',       // reduced from 512MiB to stay within quota
});

// All secrets used across functions
const ALL_SECRETS = [
  OPENROUTER_KEY,
  GROQ_KEY,
  TOGETHER_KEY,
  HF_KEY,
  DEEPSEEK_KEY,
  MISTRAL_KEY,
  TAVILY_KEY,
  GOOGLE_TTS_KEY,
];

// ── CORS helper ────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://9jai.web.app',
  'https://9jai.firebaseapp.com',
  'http://localhost:3000',
  'http://localhost:5173',
  // Allow all Firebase hosting domains (supports global access including Nigeria)
];

function setCorsHeaders(req: any, res: any): boolean {
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

function genRequestId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// ── Rate limiting (simple in-memory, per function instance) ───────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per minute per IP
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── /ai/chat — non-streaming chat ─────────────────────────────────────────

export const aiChat = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

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

    const body = req.body as AIRequest;
    if (!body.messages && !body.prompt) {
      res.status(400).json({ error: 'messages or prompt required' });
      return;
    }

    const userId = req.headers['x-user-id'] as string | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;

    try {
      const result = await routeChat({
        ...body,
        task: 'chat',
        userId,
        sessionId,
      });

      // Log async
      logRequest({
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
      }).catch(() => {});

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[aiChat] Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error', text: 'Something went wrong. Please try again.' });
    }
  }
);

// ── /ai/stream — Server-Sent Events streaming ─────────────────────────────

export const aiStream = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 60 },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    const ip = req.ip ?? 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Rate limit exceeded.' });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const body = req.body as AIRequest;
    if (!body.messages && !body.prompt) {
      res.status(400).json({ error: 'messages or prompt required' });
      return;
    }

    const requestId = genRequestId();
    const userId = req.headers['x-user-id'] as string | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;
    const startTime = Date.now();

    // Set SSE headers
    res.set('Content-Type', 'text/event-stream');
    res.set('Cache-Control', 'no-cache, no-transform');
    res.set('X-Accel-Buffering', 'no'); // disable nginx buffering
    res.set('Connection', 'keep-alive');
    res.flushHeaders();

    // Helper to write SSE events
    const sendEvent = (event: string, data: object) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Use non-streaming route but emit chunks as SSE
      // (True streaming from providers requires HTTP/2 pass-through — use non-streaming for now)
      const result = await routeChat({
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
      logRequest({
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
      }).catch(() => {});

    } catch (err: any) {
      console.error('[aiStream] Error:', err);
      sendEvent('error', { message: 'Stream failed. Please try again.' });
    } finally {
      res.end();
    }
  }
);

// ── /ai/image — image generation ──────────────────────────────────────────

export const aiImage = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { prompt, preferredProviders } = req.body as AIRequest;
    if (!prompt) {
      res.status(400).json({ error: 'prompt required' });
      return;
    }

    const requestId = genRequestId();

    try {
      const result = await routeImage({ task: 'image', prompt, preferredProviders });

      logRequest({
        requestId,
        task: 'image',
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        cached: false,
        success: true,
        timestamp: Date.now(),
      }).catch(() => {});

      // Return both URL and base64 — frontend uses base64 for instant render
      res.status(200).json({
        imageUrl: result.imageBase64 ?? result.imageUrl,
        imageBase64: result.imageBase64,
        directUrl: result.imageUrl,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      });
    } catch (err: any) {
      console.error('[aiImage] Error:', err);
      res.status(500).json({ error: 'Image generation failed' });
    }
  }
);

// ── /ai/transcribe — Whisper audio transcription ──────────────────────────

export const aiTranscribe = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 60, memory: '256MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { audioBase64, mimeType, language } = req.body as {
      audioBase64: string;
      mimeType?: string;
      language?: string;
    };

    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 required' });
      return;
    }

    const requestId = genRequestId();

    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const result = await routeTranscribe(audioBuffer, mimeType ?? 'audio/webm', language);

      logRequest({
        requestId,
        task: 'transcribe',
        provider: result.provider,
        model: 'whisper-large-v3',
        latencyMs: result.latencyMs,
        cached: false,
        success: true,
        timestamp: Date.now(),
      }).catch(() => {});

      res.status(200).json({ text: result.text, provider: result.provider });
    } catch (err: any) {
      console.error('[aiTranscribe] Error:', err);
      res.status(500).json({ error: 'Transcription failed', text: '' });
    }
  }
);

// ── /ai/search — Tavily web search ────────────────────────────────────────

export const aiSearch = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { query } = req.body as { query: string };
    if (!query) {
      res.status(400).json({ error: 'query required' });
      return;
    }

    try {
      const result = await routeSearch(query);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('[aiSearch] Error:', err);
      res.status(500).json({ error: 'Search failed', context: '', results: [] });
    }
  }
);

// ── /ai/tts — Google Cloud TTS Nigerian voices ────────────────────────────

export const aiTTS = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 30 },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { text, assistantId } = req.body as { text: string; assistantId?: string };
    if (!text) {
      res.status(400).json({ error: 'text required' });
      return;
    }

    try {
      const result = await synthesizeNigerianSpeech(text, assistantId || 'nosa');

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
    } catch (err: any) {
      console.error('[aiTTS] Error:', err);
      res.status(500).json({ error: 'TTS failed', fallback: true });
    }
  }
);

// ── /ai/health — provider health dashboard ────────────────────────────────

export const aiHealth = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    const snapshots = getAllHealthSnapshots();
    const cacheStats = getMemCacheStats();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      providers: snapshots,
      cache: cacheStats,
      version: '2.0.0',
    });
  }
);
