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

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as crypto from 'crypto';

const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath) && process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: envPath, override: false });
}

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
import { tesseractOCR, tesseractOCRWithLayout } from './providers/tesseract';
import { ollamaVisionWithFallback } from './providers/ollamaVision';
import { groqVisionWithFallback } from './providers/groq';
import { getCurrentTime, getTimezoneFromCity, formatTimeNaturally } from './providers/time';
import { getWeatherWithRetry, formatWeatherNaturally } from './providers/weather';

import { routeChat, routeImage, routeTranscribe, routeSearch } from './router';
import { getAllHealthSnapshots, logRequest } from './logger';
import { getMemCacheStats } from './cache';
import { AIRequest, ProviderHealth } from './types';
import { generateMedia } from './media/engine';
import { getProviderVerificationReports, type ProviderVerificationReport } from './media/providerRegistry';
import { aiCertificationEngine } from './media/certificationEngine';
import { aiRecoveryEngine } from './media/recoveryEngine';
import { aiIntelligenceLayer } from './media/aiIntelligenceLayer';
import { unifiedAICore } from './media/unifiedAICore';
import { creativeIntelligenceEngine } from './media/creativeIntelligenceEngine';
import { performanceIntelligenceEngine } from './media/performanceIntelligenceEngine';
import { reasoningExplanationEngine } from './media/reasoningExplanationEngine';
import { expertIntelligencePlatform } from './media/expertIntelligencePlatform';
import { cognitiveIntelligenceSystem } from './media/cognitiveIntelligenceSystem';
import { apesSystem } from './media/apesSystem';
import { deseSystem } from './media/deseSystem';
import { submitVideoJob, refreshVideoJob, getVideoWorkerHealth } from './videoWorker';

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

// Simple in-memory stores for Version 1.0 API compatibility
interface KnowledgeDocumentRecord {
  id: string;
  title: string;
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const documentStore = new Map<string, KnowledgeDocumentRecord>();

interface PluginDescriptor {
  id: string;
  name: string;
  version: string;
  description?: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
  state: 'registered' | 'initialized' | 'running' | 'disabled';
}

const pluginRegistry = new Map<string, PluginDescriptor>();

interface ConnectorDescriptor {
  id: string;
  name: string;
  version: string;
  description?: string;
  capabilities?: Array<{ id: string; kind: string; description: string }>;
  metadata?: Record<string, unknown>;
  state: 'registered' | 'healthy' | 'degraded' | 'unhealthy';
  lastHealth?: { status: string; details?: Record<string, unknown>; timestamp: string };
}

const connectorRegistry = new Map<string, ConnectorDescriptor>();

function generateResourceId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractPathParam(req: any, prefix: string): string | null {
  const candidate = String(req.path ?? req.url ?? '');
  const regex = new RegExp(`^${prefix.replace(/\//g, '\\/')}/([^/?#]+)`);
  const match = candidate.match(regex);
  return match ? decodeURIComponent(match[1]) : null;
}

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

function buildReadinessPayload(providerReports: Record<string, ProviderVerificationReport>) {
  const providers = Object.values(providerReports);
  const missingSecrets = providers
    .filter((provider) => provider.status === 'missing-secret')
    .map((provider) => provider.secretName || provider.providerId);
  const disabledProviders = providers.filter((provider) => provider.status === 'disabled').map((provider) => provider.providerId);
  const authFailedProviders = providers.filter((provider) => provider.status === 'auth-failed').map((provider) => provider.providerId);
  const unavailableProviders = providers.filter((provider) => provider.status === 'unavailable').map((provider) => provider.providerId);
  const healthyProviders = providers.filter((provider) => provider.status === 'healthy');

  return {
    status: missingSecrets.length === 0 && authFailedProviders.length === 0 && unavailableProviders.length === 0 && healthyProviders.length > 0 ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    region: 'us-central1',
    missingSecrets,
    disabledProviders,
    authFailedProviders,
    unavailableProviders,
    providerSummary: providers.map((provider) => ({
      providerId: provider.providerId,
      displayName: provider.displayName,
      status: provider.status,
      ready: provider.ready,
      secretConfigured: provider.secretConfigured,
      disabled: provider.disabled,
      details: provider.details,
      health: provider.health,
    })),
  };
}

// ── Request ID generator ───────────────────────────────────────────────────

function genRequestId(): string {
  return crypto.randomBytes(8).toString('hex');
}

function getRouteSuffix(req: any, basePath: string): string {
  const path = String(req.originalUrl ?? req.url ?? req.path ?? '');
  const normalized = path.split('?')[0];
  if (!normalized.startsWith(basePath)) return normalized.replace(/^\/+/, '');
  return normalized.slice(basePath.length).replace(/^\/+/, '');
}

function parsePathId(route: string): string | null {
  const value = route.split('/').filter(Boolean)[0];
  return value ? decodeURIComponent(value) : null;
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
    console.info('[aiChat] Request diagnostics:', JSON.stringify({
      payloadBytes: Buffer.byteLength(JSON.stringify(body), 'utf8'),
      messageCount: body.messages?.length ?? 0,
      attachmentCount: Array.isArray((body as any).attachments) ? (body as any).attachments.length : 0,
      selectedModel: body.model ?? 'auto',
      requestTimeoutMs: 60000,
      responseTimeoutMs: 60000,
    }));

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
    console.info('[aiStream] Request diagnostics:', JSON.stringify({
      payloadBytes: Buffer.byteLength(JSON.stringify(body), 'utf8'),
      messageCount: body.messages?.length ?? 0,
      attachmentCount: Array.isArray((body as any).attachments) ? (body as any).attachments.length : 0,
      selectedModel: body.model ?? 'auto',
      requestTimeoutMs: 60000,
      responseTimeoutMs: 60000,
    }));

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

// ── /ai/video — shared media orchestration path ───────────────────────────

export const aiVideo = onRequest(
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
      const intelligence = await aiIntelligenceLayer.processRequest({
        task: 'video',
        prompt,
        preferredProviders,
      });

      const result = await generateMedia({
        kind: 'text-to-video',
        prompt: intelligence.optimizedPrompt,
        preferredProviders: intelligence.preferredProviders,
      });

      logRequest({
        requestId,
        task: 'video',
        provider: result.provider,
        model: result.model ?? 'unknown',
        latencyMs: result.latencyMs ?? 0,
        cached: false,
        success: true,
        timestamp: Date.now(),
      }).catch(() => {});

      res.status(200).json({
        videoUrl: result.mediaUrl,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      });
    } catch (err: any) {
      console.error('[aiVideo] Error:', err);
      res.status(503).json({
        error: 'Video generation is temporarily unavailable because no certified video generation provider is currently available.',
      });
    }
  }
);

// ── Version 1.0 compatibility: /api/v1/document and /api/v1/ocr ─────────────

export const v1Document = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 120, memory: '256MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    const route = getRouteSuffix(req, '/api/v1/documents');
    const documentId = parsePathId(route);

    if (req.method === 'POST' && route === '') {
      const payload = req.body as { title?: string; content?: string; language?: string; metadata?: Record<string, unknown> };
      if (!payload?.content || !payload?.title) {
        res.status(400).json({ status: 'error', error: 'title and content required' });
        return;
      }

      const id = generateResourceId('doc');
      const now = new Date().toISOString();
      documentStore.set(id, {
        id,
        title: payload.title,
        content: payload.content,
        language: payload.language,
        metadata: payload.metadata,
        createdAt: now,
        updatedAt: now,
      });

      res.status(201).json({ status: 'success', data: { documentId: id } });
      return;
    }

    if (req.method === 'GET' && documentId) {
      const document = documentStore.get(documentId);
      if (!document) {
        res.status(404).json({ status: 'error', error: 'document not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: document });
      return;
    }

    res.status(405).json({ status: 'error', error: 'Method not allowed' });
  }
);

async function performOcrExtraction(imageUrl: string, language?: string): Promise<{ rawText: string; pages: unknown[] }> {
  try {
    const result = await tesseractOCR(imageUrl, language || 'eng');
    const rawText = result.text.trim();
    if (!rawText) throw new Error('No readable text found');
    return {
      rawText,
      pages: [{
        pageNumber: 1,
        blocks: [{
          id: `block-${Date.now()}`,
          type: 'paragraph',
          lines: [{ spans: [{ text: rawText, confidence: result.confidence, bbox: [0, 0, 0, 0] }], lineConfidence: result.confidence }],
          confidence: result.confidence,
        }],
      }],
    };
  } catch (err: any) {
    console.warn('[performOcrExtraction] Tesseract fallback failed:', err?.message ?? err);
  }

  throw new Error('No OCR provider returned readable text');
}

export const v1Ocr = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 120, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', error: 'Method not allowed' });
      return;
    }

    const { imageUrl, language, layout } = req.body as { imageUrl?: string; language?: string; layout?: boolean };
    if (!imageUrl) {
      res.status(400).json({ status: 'error', error: 'imageUrl required' });
      return;
    }

    const parsedImage = parseAndNormalizeImagePayload(imageUrl as string);
    const MAX_INLINE_IMAGE_BYTES = Number(process.env.MAX_INLINE_IMAGE_BYTES || 1572864);
    if (parsedImage.byteLength > MAX_INLINE_IMAGE_BYTES) {
      res.status(413).json({
        status: 'error',
        error: 'IMAGE_TOO_LARGE',
        message: 'Image is too large for OCR.',
        suggestion: 'Resize or compress the image and try again.',
        size: parsedImage.byteLength,
        maxInlineBytes: MAX_INLINE_IMAGE_BYTES,
      });
      return;
    }

    try {
      // Try Tesseract first (FREE, no API key)
      if (layout) {
        const result = await tesseractOCRWithLayout(imageUrl, language || 'eng');
        res.status(200).json({
          status: 'success',
          data: {
            text: result.text,
            confidence: result.confidence,
            provider: 'tesseract',
            layout: {
              pages: [{
                pageNumber: 1,
                words: result.words,
                lines: result.lines,
                paragraphs: result.paragraphs,
              }],
            },
          },
        });
      } else {
        const result = await tesseractOCR(imageUrl, language || 'eng');
        res.status(200).json({
          status: 'success',
          data: {
            text: result.text,
            confidence: result.confidence,
            provider: 'tesseract',
          },
        });
      }
    } catch (err: any) {
      console.error('[v1Ocr] Tesseract failed, trying OpenRouter fallback:', err);
      
      // Fallback to OpenRouter vision if Tesseract fails
      try {
        const result = await performOcrExtraction(imageUrl, language);
        const layoutData = layout ? { pages: result.pages } : undefined;

        res.status(200).json({
          status: 'success',
          data: {
            text: result.rawText,
            layout: layoutData,
            provider: 'openrouter-fallback',
          },
        });
      } catch (fallbackErr: any) {
        console.error('[v1Ocr] All OCR methods failed:', fallbackErr);
        res.status(500).json({ status: 'error', error: 'OCR processing failed' });
      }
    }
  }
);

export const v1ImageGenerate = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', error: 'Method not allowed' });
      return;
    }

    const { prompt, style, size } = req.body as { prompt?: string; style?: string; size?: string };
    if (!prompt) {
      res.status(400).json({ status: 'error', error: 'prompt required' });
      return;
    }

    try {
      const result = await routeImage({ task: 'image', prompt, preferredProviders: undefined });
      res.status(200).json({ status: 'success', data: { imageUrl: result.imageUrl ?? result.imageBase64 ?? '', metadata: { provider: result.provider, model: result.model, style, size } } });
    } catch (err: any) {
      console.error('[v1ImageGenerate] Error:', err);
      res.status(500).json({ status: 'error', error: 'Image generation failed' });
    }
  }
);

export const v1VideoProcess = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', error: 'Method not allowed' });
      return;
    }

    const { sourceUrl, instructions, outputFormat, prompt, imageDataUrl, task, duration, width, height, model } = req.body as { sourceUrl?: string; instructions?: string; outputFormat?: string; prompt?: string; imageDataUrl?: string; task?: string; duration?: number; width?: number; height?: number; model?: string };
    const textPrompt = prompt || instructions;

    if ((!sourceUrl || !instructions) && !textPrompt) {
      res.status(400).json({ status: 'error', error: 'sourceUrl and instructions or prompt required' });
      return;
    }

    try {
      const requestPrompt = sourceUrl && instructions ? `${instructions} ${sourceUrl}` : textPrompt || '';
      const job = await submitVideoJob({
        prompt: requestPrompt.slice(0, 4000),
        image: imageDataUrl || sourceUrl,
        duration: Math.min(Math.max(Number(duration) || 5, 1), Number(process.env.VIDEO_MAX_DURATION || 10)),
        width: Math.min(Number(width) || 768, Number(process.env.VIDEO_MAX_WIDTH || 1280)),
        height: Math.min(Number(height) || 432, Number(process.env.VIDEO_MAX_HEIGHT || 720)),
        model,
      });
      res.status(202).json({ status: job.status, data: { jobId: job.jobId, provider: 'video-worker', model: job.model, outputFormat: outputFormat ?? 'mp4' } });
    } catch (err: any) {
      console.error('[v1VideoProcess] Error:', err);
      res.status(503).json({ status: 'error', error: err?.message || 'Video processing unavailable' });
    }
  }
);

export const v1VideoStatus = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 60 },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    if (req.method !== 'GET') {
      res.status(405).json({ status: 'error', error: 'Method not allowed' });
      return;
    }
    const jobId = String(req.query.jobId || req.path.split('/').filter(Boolean).pop() || '');
    if (!jobId) {
      res.status(400).json({ status: 'error', error: 'jobId required' });
      return;
    }
    try {
      const job = await refreshVideoJob(jobId);
      res.status(200).json({ status: job.status, data: job });
    } catch (error) {
      res.status(404).json({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  }
);

export const v1VideoWorkerHealth = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 30 },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    if (req.method !== 'GET') {
      res.status(405).json({ status: 'error', error: 'Method not allowed' });
      return;
    }
    res.status(200).json(await getVideoWorkerHealth());
  }
);

export const v1PluginRegistry = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 120 },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    const route = getRouteSuffix(req, '/api/v1/plugins');
    const pluginId = parsePathId(route);

    if (req.method === 'POST' && (route === '' || route === 'register')) {
      const body = req.body as { id?: string; name?: string; version?: string; description?: string; capabilities?: string[]; metadata?: Record<string, unknown> };
      if (!body?.id || !body?.name || !body?.version) {
        res.status(400).json({ status: 'error', error: 'id, name, and version required' });
        return;
      }

      const pluginId = body.id;
      if (pluginRegistry.has(pluginId)) {
        res.status(409).json({ status: 'error', error: 'plugin already registered' });
        return;
      }

      pluginRegistry.set(pluginId, { id: pluginId, name: body.name, version: body.version, description: body.description, capabilities: body.capabilities, metadata: body.metadata, state: 'registered' });
      res.status(201).json({ status: 'success', data: { pluginId: body.id } });
      return;
    }

    if (req.method === 'GET' && pluginId) {
      const plugin = pluginRegistry.get(pluginId);
      if (!plugin) {
        res.status(404).json({ status: 'error', error: 'plugin not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: plugin });
      return;
    }

    if (req.method === 'GET' && route === '') {
      res.status(200).json({ status: 'success', data: Array.from(pluginRegistry.values()) });
      return;
    }

    res.status(405).json({ status: 'error', error: 'Method not allowed' });
  }
);

export const v1ConnectorRegistry = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 120 },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    const route = getRouteSuffix(req, '/api/v1/connectors');
    const connectorId = parsePathId(route);
    const routeSuffix = route?.replace(connectorId ? connectorId : '', '').replace(/^\/+/, '') ?? '';

    if (req.method === 'POST' && (route === '' || route === 'register')) {
      const body = req.body as { id?: string; name?: string; version?: string; description?: string; capabilities?: Array<{ id: string; kind: string; description: string }>; metadata?: Record<string, unknown> };
      if (!body?.id || !body?.name || !body?.version) {
        res.status(400).json({ status: 'error', error: 'id, name, and version required' });
        return;
      }

      const connectorId = body.id;
      if (connectorRegistry.has(connectorId)) {
        res.status(409).json({ status: 'error', error: 'connector already registered' });
        return;
      }

      connectorRegistry.set(connectorId, {
        id: connectorId,
        name: body.name,
        version: body.version,
        description: body.description,
        capabilities: body.capabilities,
        metadata: body.metadata,
        state: 'registered',
        lastHealth: { status: 'healthy', timestamp: new Date().toISOString() },
      });

      res.status(201).json({ status: 'success', data: { connectorId: body.id } });
      return;
    }

    if (req.method === 'GET' && connectorId && (!routeSuffix || routeSuffix === 'health')) {
      const connector = connectorRegistry.get(connectorId);
      if (!connector) {
        res.status(404).json({ status: 'error', error: 'connector not found' });
        return;
      }
      if (routeSuffix === 'health') {
        res.status(200).json({ status: 'success', data: connector.lastHealth ?? { status: 'unknown', timestamp: new Date().toISOString() } });
        return;
      }
      res.status(200).json({ status: 'success', data: connector });
      return;
    }

    if (req.method === 'GET' && route === '') {
      res.status(200).json({ status: 'success', data: Array.from(connectorRegistry.values()) });
      return;
    }

    res.status(405).json({ status: 'error', error: 'Method not allowed' });
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

    const { audioBase64, audioUrl, mimeType, language } = req.body as {
      audioBase64?: string;
      audioUrl?: string;
      mimeType?: string;
      language?: string;
    };

    if (!audioBase64 && !audioUrl) {
      res.status(400).json({ error: 'audioBase64 or audioUrl required' });
      return;
    }

    const requestId = genRequestId();

    try {
      let audioBuffer: Buffer;
      let resolvedMimeType = mimeType ?? 'audio/webm';

      if (audioUrl) {
        const response = await fetch(audioUrl, { method: 'GET' });
        if (!response.ok) {
          res.status(400).json({ error: 'Unable to fetch audioUrl' });
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        resolvedMimeType = mimeType ?? response.headers.get('content-type') ?? resolvedMimeType;
      } else {
        audioBuffer = Buffer.from(audioBase64 as string, 'base64');
      }

      const result = await routeTranscribe(audioBuffer, resolvedMimeType, language);

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

    const { text, assistantId, voice } = req.body as { text?: string; assistantId?: string; voice?: string; language?: string };
    if (!text) {
      res.status(400).json({ error: 'text required' });
      return;
    }

    try {
      const voiceId = assistantId || voice || 'nosa';
      const result = await synthesizeNigerianSpeech(text, voiceId);

      if (!result) {
        // Google TTS not configured or failed — tell client to use browser TTS
        res.status(503).json({ error: 'TTS unavailable', fallback: true });
        return;
      }

      res.status(200).json({
        audioBase64: result.audioBase64,
        contentType: result.contentType,
        assistantId: voiceId,
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
    const providerRegistry = await getProviderVerificationReports();
    const readiness = buildReadinessPayload(providerRegistry);
    const certificationReport = aiCertificationEngine.certifyAll();
    const recoveryHistory = aiRecoveryEngine.getHistory();
    const pendingVerification = aiRecoveryEngine.getPendingVerification();
    const intelligenceSnapshot = aiIntelligenceLayer.getLearningSnapshot();
    const characterMemory = aiIntelligenceLayer.getCharacterMemory();
    const creativeTelemetry = creativeIntelligenceEngine.getTelemetry();
    const performanceTelemetry = performanceIntelligenceEngine.getTelemetry();
    const benchmarkSummary = performanceIntelligenceEngine.getBenchmarkSummary();
    const explanationHistory = reasoningExplanationEngine.getHistory();
    const reasoningTelemetry = reasoningExplanationEngine.getTelemetry();
    const cognitiveTelemetry = cognitiveIntelligenceSystem.getTelemetry();
    const apesTelemetry = apesSystem.getTelemetry();
    const deseTelemetry = deseSystem.getTelemetry();
    const unifiedPlan = await unifiedAICore.planRequest({
      task: 'chat',
      prompt: 'Create a YouTube video about Nigerian cuisine.',
    });
    const unifiedTelemetry = unifiedAICore.getTelemetry();
    const expertTelemetry = expertIntelligencePlatform.getTelemetry();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      providers: snapshots,
      providerRegistry,
      readiness,
      certification: certificationReport,
      recovery: {
        history: recoveryHistory,
        pendingVerification,
        recommendedActions: pendingVerification.length > 0 ? ['verify providers now', 'review missing permissions', 'promote certified alternatives'] : ['no recovery queue'],
      },
      intelligence: {
        snapshot: intelligenceSnapshot,
        characterMemory,
        promptCategories: intelligenceSnapshot.promptCategories,
        mostUsedModels: intelligenceSnapshot.mostUsedModels,
      },
      creativeIntelligence: creativeTelemetry,
      performanceIntelligence: performanceTelemetry,
      benchmarkResults: benchmarkSummary,
      explanationHistory,
      reasoningTelemetry,
      expertIntelligence: expertTelemetry,
      cognitiveIntelligence: cognitiveTelemetry,
      projectOperations: apesTelemetry,
      synchronizationExecution: deseTelemetry,
      unifiedCore: {
        reasoning: unifiedPlan.reasoning,
        tasks: unifiedPlan.tasks,
        providers: unifiedPlan.providers,
        progressStages: unifiedPlan.progressStages,
        executionDurationMs: unifiedTelemetry.executionDurationMs,
        successRate: unifiedTelemetry.successRate,
        recoveryEvents: unifiedTelemetry.recoveryEvents,
      },
      cache: cacheStats,
      version: '2.0.0',
    });
  }
);

export const aiLiveness = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      region: 'us-central1',
    });
  }
);

export const aiReady = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const providerRegistry = await getProviderVerificationReports();
    const readiness = buildReadinessPayload(providerRegistry);
    res.status(readiness.status === 'ready' ? 200 : 503).json(readiness);
  }
);

// ── /ai/replay — Execution replay without regenerating content ──────────

export const aiReplay = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    const requestId = String(req.query.requestId ?? req.body?.requestId ?? '');
    if (!requestId) {
      res.status(400).json({ error: 'requestId required' });
      return;
    }

    try {
      const replay = performanceIntelligenceEngine.getReplay(requestId);
      res.status(200).json(replay);
    } catch (err: any) {
      res.status(404).json({ error: 'Replay trace not found', message: err?.message ?? String(err) });
    }
  }
);

// ── /ai/explanation — Internal explanation lookup for admin diagnostics ───────────────────

export const aiExplanation = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    const requestId = String(req.query.requestId ?? req.body?.requestId ?? '');
    if (!requestId) {
      res.status(400).json({ error: 'requestId required' });
      return;
    }

    try {
      const report = reasoningExplanationEngine.getExplanation(requestId);
      res.status(200).json({
        ok: true,
        explanation: report,
      });
    } catch (err: any) {
      res.status(404).json({ error: 'Explanation not found', message: err?.message ?? String(err) });
    }
  }
);

// ── /ai/fetchImage — Proxy external image URLs to base64 ───────────────────

export const aiFetchImage = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 60, memory: '256MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url required' });
      return;
    }

    try {
      // Fetch the external image with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Compatible; 9jai-ImageProxy/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        res.status(response.status).json({ error: 'Failed to fetch external URL' });
        return;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/png';

      res.status(200).json({
        imageBase64: `data:${contentType};base64,${base64}`,
        contentType,
        size: buffer.byteLength,
      });
    } catch (err: any) {
      console.error('[aiFetchImage] Error:', err);
      if (err.name === 'AbortError') {
        res.status(408).json({ error: 'Image fetch timeout' });
      } else {
        res.status(500).json({ error: 'Failed to proxy image' });
      }
    }
  }
);

// ── /ai/visual-orchestrator — Visual Orchestrator (v1) ─────────────────────

export const v1VisualOrchestrator = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { prompt, messages, imageBase64, imageUrl, preferredProviders } = req.body as any;
    if (!prompt && !messages && !imageBase64 && !imageUrl) {
      res.status(400).json({ error: 'prompt, messages, or image required' });
      return;
    }

    // Lightweight intent detection (heuristic) — upgrade to ML-based intent detection later
    const text = prompt ?? (Array.isArray(messages) ? messages.map((m: any) => m.content || '').join(' ') : '') ?? '';
    const lower = String(text).toLowerCase();

    const visualKeywords = [
      'diagram', 'image', 'show me', 'illustration', 'explain with', 'diagram of', 'labeled', 'flyer', 'poster', 'infographic', 'chart', 'graph', 'map', 'timeline', 'generate image', 'create a'
    ];

    let visualRequired = visualKeywords.some((k) => lower.includes(k));
    if (imageBase64 || imageUrl) visualRequired = true;

    // Visual type classification (simple rules)
    let visualType = 'illustration';
    if (/diagram|labeled|schematic|anatomy|flowchart|process|mechanical|engineering|electrical|circuit|graph|plot|chart|map|timeline/.test(lower)) visualType = 'diagram';
    else if (/flyer|poster|advert|advertisement|banner|menu|certificate|letterhead|business card/.test(lower)) visualType = 'design';
    else if (/photo|photograph|realistic|3d|render|portrait|landscape/.test(lower)) visualType = 'photograph';
    else if (/infographic|comparison|timeline|chart|graph|plot/.test(lower)) visualType = 'infographic';

    let imageUrlOut: string | null = null;
    let imageDataUrl: string | null = null;
    let providerOut: string | null = null;
    let modelOut: string | null = null;

    try {
      // If a visual is required and no user-supplied image was provided, ask the engine to generate one
      if (visualRequired && !imageBase64 && !imageUrl) {
        const genPrompt = prompt || text || `Generate an educational ${visualType}`;
        const result = await generateMedia({ kind: 'image', prompt: genPrompt, preferredProviders });
        providerOut = result.provider as string;
        modelOut = result.model || null;

        if (result.mediaUrl) {
          imageUrlOut = result.mediaUrl;
        }

        if (result.imageBase64 && !imageUrlOut) {
          const base64 = result.imageBase64.replace(/^data:[^;]+;base64,/, '');
          imageDataUrl = `data:image/png;base64,${base64}`;
          try {
            const bucket = admin.storage().bucket();
            const filename = `visuals/${generateResourceId('visual')}.png`;
            const file = bucket.file(filename);
            await file.save(Buffer.from(base64, 'base64'), { contentType: 'image/png' });
            imageUrlOut = `https://storage.googleapis.com/${bucket.name}/${filename}`;
          } catch (uploadErr: any) {
            console.warn('[v1VisualOrchestrator] Storage upload failed:', uploadErr?.message ?? uploadErr);
            imageUrlOut = imageDataUrl;
          }
        }
      } else if (imageBase64) {
        const base64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        imageDataUrl = `data:image/png;base64,${base64}`;
        try {
          const bucket = admin.storage().bucket();
          const filename = `uploads/${generateResourceId('upload')}.png`;
          const file = bucket.file(filename);
          await file.save(Buffer.from(base64, 'base64'), { contentType: 'image/png' });
          imageUrlOut = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        } catch (uploadErr: any) {
          console.warn('[v1VisualOrchestrator] Storage upload failed:', uploadErr?.message ?? uploadErr);
          imageUrlOut = imageDataUrl;
        }
      } else if (imageUrl) {
        imageUrlOut = imageUrl;
      }
    } catch (err: any) {
      console.error('[v1VisualOrchestrator] Generation/upload failed:', err?.message ?? err);
    }

    const metadata = {
      text: prompt || text || '',
      imageUrl: imageUrlOut,
      dataUrl: imageDataUrl,
      imageType: visualType,
      title: prompt ? String(prompt).slice(0, 120) : 'Generated Visual',
      labels: [] as Array<any>,
      steps: [] as Array<any>,
      sourceType: imageBase64 ? 'uploaded' : (imageUrlOut ? 'generated' : null),
      provider: providerOut,
      model: modelOut,
      generatedAt: new Date().toISOString(),
    };

    res.status(200).json({ ok: true, visual: metadata });
  }
);

// ── /ai/vision — Image + document analysis via multimodal AI ─────────────

function parseAndNormalizeImagePayload(raw: string) {
  const isDataUrl = typeof raw === 'string' && raw.startsWith('data:');
  let base64 = raw ?? '';
  let mime = 'image/jpeg';

  if (isDataUrl) {
    const m = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
    if (m) {
      mime = m[1];
      base64 = m[2];
    } else {
      const idx = raw.indexOf(',');
      base64 = idx >= 0 ? raw.slice(idx + 1) : '';
    }
  }

  // Normalize whitespace/newlines
  base64 = base64.replace(/\s+/g, '');

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch (e) {
    buffer = Buffer.alloc(0);
  }

  // Basic detection
  if (buffer.length >= 4) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) mime = 'image/jpeg';
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) mime = 'image/png';
    else if (buffer.slice(0,4).toString() === 'RIFF' && buffer.slice(8,12).toString() === 'WEBP') mime = 'image/webp';
  }

  const dataUrl = `data:${mime};base64,${base64}`;
  return {
    dataUrl,
    mimeType: mime,
    byteLength: buffer.length,
    base64Length: base64.length,
    isDataUrl,
  };
}

export const aiVision = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 60, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { imageBase64, prompt } = req.body as { imageBase64?: string; prompt?: string };
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 required' });
      return;
    }

    // Parse + normalize the incoming image into a consistent data URL form and log safe metadata
    const parsedImage = parseAndNormalizeImagePayload(imageBase64 as string);
    console.log('[aiVision] image metadata:', { mimeType: parsedImage.mimeType, byteLength: parsedImage.byteLength, base64Length: parsedImage.base64Length, isDataUrl: parsedImage.isDataUrl });

    if (!parsedImage.byteLength) {
      res.status(400).json({ error: 'Invalid image payload', diagnostics: { reason: 'zero-length after base64 decoding' } });
      return;
    }

    // Enforce a configurable inline payload size limit to avoid gateway timeouts or transport failures.
    // Default: 1.5 MB (1572864 bytes). Can be overridden by setting MAX_INLINE_IMAGE_BYTES in environment.
    const MAX_INLINE_IMAGE_BYTES = Number(process.env.MAX_INLINE_IMAGE_BYTES || 1572864);
    if (parsedImage.byteLength > MAX_INLINE_IMAGE_BYTES) {
      console.warn('[aiVision] Rejected inline image: size exceeds MAX_INLINE_IMAGE_BYTES', { size: parsedImage.byteLength, max: MAX_INLINE_IMAGE_BYTES });
      res.status(413).json({
        error: 'IMAGE_TOO_LARGE',
        message: 'Image is too large for direct Vision analysis.',
        suggestion: 'Resize or compress the image and try again.',
        size: parsedImage.byteLength,
        maxInlineBytes: MAX_INLINE_IMAGE_BYTES,
      });
      return;
    }

    const normalizedImage = parsedImage.dataUrl;

    const analysisPrompt = prompt || 'Analyze this image in detail. Describe what you see — objects, people, text, colors, context, and any important details.';
    let freeVisionError = 'No free vision provider returned a result';

    try {
      // Prefer a reachable local open-source model, then use configured free-tier adapters.
      try {
        const result = await ollamaVisionWithFallback(normalizedImage, analysisPrompt);
        res.status(200).json({ text: result.text, model: result.model, provider: 'ollama' });
        return;
      } catch (ollamaErr: any) {
        console.warn('[aiVision] Ollama unavailable, trying Groq:', ollamaErr.message);
      }

      try {
        const result = await groqVisionWithFallback(normalizedImage, analysisPrompt);
        res.status(200).json({ text: result.text, model: result.model, provider: 'groq' });
        return;
      } catch (groqErr: any) {
        console.warn('[aiVision] Groq vision failed:', groqErr.message);
        freeVisionError = groqErr.message;
      }

      try {
        const { huggingfaceVision } = await import('./providers/huggingface');
        const result = await huggingfaceVision(imageBase64, analysisPrompt);
        res.status(200).json({ text: result.text, model: result.model, provider: 'huggingface' });
        return;
      } catch (huggingfaceErr: any) {
        console.warn('[aiVision] HuggingFace vision failed:', huggingfaceErr.message);
        freeVisionError = huggingfaceErr.message;
      }

      console.error('[aiVision] All free vision providers failed');
      res.status(503).json({
        error: 'Vision analysis unavailable',
        text: 'I could not analyze that image because no free vision engine is currently available. Configure Ollama, Groq, Hugging Face access, or a self-hosted vision worker.',
        diagnostics: {
          providersAttempted: ['ollama', 'groq', 'huggingface'],
          reason: freeVisionError,
        },
      });
    } catch (err: any) {
      console.error('[aiVision] Unexpected free-provider error:', err);
      res.status(503).json({
        error: 'Vision analysis unavailable',
        text: 'I could not analyze that image because the free vision engine is temporarily unavailable.',
      });
    }
  }
);

// ── /ai/time — Current time for any timezone (FREE) ───────────────────────

export const aiTime = onRequest(
  { secrets: ALL_SECRETS, cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { timezone, city } = req.method === 'POST' ? req.body : req.query;
    
    try {
      // If city provided, convert to timezone
      const tz = city ? getTimezoneFromCity(city as string) : (timezone as string || 'Africa/Lagos');
      
      const timeData = getCurrentTime(tz);
      const naturalText = formatTimeNaturally(timeData);
      
      res.status(200).json({
        ...timeData,
        naturalText,
        provider: 'nodejs-builtin',
      });
    } catch (err: any) {
      console.error('[aiTime] Error:', err);
      res.status(500).json({ 
        error: 'Time retrieval failed',
        message: err.message,
      });
    }
  }
);

// ── /ai/weather — Weather forecast via Open-Meteo (FREE) ─────────────────

export const aiWeather = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 30 },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { location, city } = req.method === 'POST' ? req.body : req.query;
    const searchLocation = (location || city) as string;
    
    if (!searchLocation) {
      res.status(400).json({ error: 'location or city parameter required' });
      return;
    }

    try {
      const weatherData = await getWeatherWithRetry(searchLocation, 2);
      const naturalText = formatWeatherNaturally(weatherData);
      
      res.status(200).json({
        ...weatherData,
        naturalText,
        provider: 'open-meteo',
      });
    } catch (err: any) {
      console.error('[aiWeather] Error:', err);
      res.status(500).json({ 
        error: 'Weather retrieval failed',
        message: err.message,
      });
    }
  }
);
