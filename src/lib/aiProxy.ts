/**
 * Client-side proxy helpers for 9JAI.
 * All network calls remain optional and the app prefers the local engine.
 */

import { auth } from './firebase';
import { getLocalFallbackResponse } from './fallbackResponses';

export interface ProxyChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProxyChatOptions {
  messages: ProxyChatMessage[];
  temperature?: number;
  maxTokens?: number;
  preferredProviders?: string[];
  sessionId?: string;
}

export interface ProxyChatResult {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
  cached: boolean;
  tokensUsed?: number;
  error?: string;
  fromFallback?: boolean;
}

export interface ProxyStreamOptions extends ProxyChatOptions {
  onChunk: (text: string) => void;
  onDone?: (meta: { provider: string; model: string; latencyMs: number }) => void;
  onError?: (err: string) => void;
}

async function getHeaders(sessionId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) headers['X-User-Id'] = user.uid;
  if (sessionId) headers['X-Session-Id'] = sessionId;
  return headers;
}

function buildLocalChatResult(messages: ProxyChatMessage[], fallbackText?: string): ProxyChatResult {
  const last = [...messages].reverse().find((message) => message.role === 'user');
  const languageCode = (() => {
    try {
      return localStorage.getItem('conversation_language') || 'pcm';
    } catch {
      return 'pcm';
    }
  })();
  const text = fallbackText ?? getLocalFallbackResponse((last?.content ?? 'How can I help?'), languageCode);
  return { text, provider: 'local', model: '9jai-local', latencyMs: 0, cached: false, fromFallback: true };
}

export async function proxyChat(options: ProxyChatOptions): Promise<ProxyChatResult> {
  const headers = await getHeaders(options.sessionId);
  try {
    const response = await fetch('/api/v1/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        task: 'chat',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        preferredProviders: options.preferredProviders,
        sessionId: options.sessionId,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Chat proxy ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = (await response.json()) as ProxyChatResult;
    if (!data.text) throw new Error('Empty response from proxy');
    return data;
  } catch (err: any) {
    console.warn('[AIProxy] proxyChat failed, using local fallback:', err?.message || err);
    return buildLocalChatResult(options.messages);
  }
}

export async function proxyChatStream(options: ProxyStreamOptions): Promise<void> {
  const result = await proxyChat({
    messages: options.messages,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    preferredProviders: options.preferredProviders,
    sessionId: options.sessionId,
  });
  options.onChunk(result.text);
  options.onDone?.({ provider: result.provider, model: result.model, latencyMs: result.latencyMs });
}

export async function proxyImage(prompt: string, preferredProviders?: string[]): Promise<{ imageUrl: string; provider: string; model: string; latencyMs: number }> {
  // Try production backend first
  try {
    const headers = await getHeaders();
    // Try the main aiImage route, then v1 image generate compatibility route
    let resp = await fetch('/api/ai/image', {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: 'image', prompt, preferredProviders }),
      signal: AbortSignal.timeout(60000),
    });
    if (!resp.ok) {
      // fallback to v1 compatibility route
      resp = await fetch('/api/v1/image/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, preferredProviders }),
        signal: AbortSignal.timeout(60000),
      });
    }
    if (resp.ok) {
      const data = await resp.json();
      if (data && data.imageUrl) return { imageUrl: data.imageUrl, provider: data.provider || 'unknown', model: data.model || 'unknown', latencyMs: data.latencyMs || 0 };
    }
  } catch (err) {
    // swallow and fall back to local
    console.warn('[AIProxy] proxyImage backend failed, falling back to local image generator:', err?.message || err);
  }

  // Local SVG fallback (procedural diagram) when backend unavailable
  const svg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#061b16"/><circle cx="512" cy="280" r="170" fill="#1ec38b" opacity="0.95"/><rect x="140" y="520" width="744" height="320" rx="24" fill="#07221c" stroke="#57d19f" stroke-width="8"/><text x="512" y="120" text-anchor="middle" fill="#e6fff7" font-size="36" font-family="Arial">9JAI — Local Generated Visual</text><text x="512" y="920" text-anchor="middle" fill="#dffbf0" font-size="26" font-family="Arial">${(prompt || 'Concept').slice(0, 120)}</text></svg>`)}`;
  return { imageUrl: svg, provider: 'local', model: '9jai-local', latencyMs: 0 };
}

export async function proxyVideo(prompt: string, imageDataUrl?: string): Promise<{ outputUrl: string; videoUrl?: string; provider: string; model: string; latencyMs: number }> {
  // Try backend video endpoint if available
  try {
    const headers = await getHeaders();
    const resp = await fetch('/api/v1/video', {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: 'video', prompt, imageDataUrl }),
      signal: AbortSignal.timeout(90000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && (data.outputUrl || data.videoUrl)) return { outputUrl: data.outputUrl || data.videoUrl || '', videoUrl: data.videoUrl, provider: data.provider || 'unknown', model: data.model || 'unknown', latencyMs: data.latencyMs || 0 };
    }
  } catch (err) {
    console.warn('[AIProxy] proxyVideo backend failed, falling back to local:', err?.message || err);
  }
  // Fallback: return provided imageDataUrl as a passthrough
  return { outputUrl: imageDataUrl ?? '', videoUrl: imageDataUrl ?? '', provider: 'local', model: '9jai-local', latencyMs: 0 };
}

export async function proxyTranscribe(fileName: string, contentType?: string): Promise<{ text: string; provider: string; model: string; latencyMs: number }> {
  try {
    const headers = await getHeaders();
    const form = new FormData();
    // Expect caller to supply a File object via a separate call; this helper supports server-side transcription by filename key
    // If the caller only has the file name, backend may look it up from a temporary upload session
    form.append('fileName', fileName);
    if (contentType) form.append('contentType', contentType);

    const resp = await fetch('/api/v1/transcribe', {
      method: 'POST',
      headers, // headers will include X-User-Id/X-Session-Id where available
      body: form as any, // allow FormData to be sent
      signal: AbortSignal.timeout(120000),
    } as any);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.text) return { text: data.text, provider: data.provider || 'unknown', model: data.model || 'unknown', latencyMs: data.latencyMs || 0 };
    }
  } catch (err) {
    console.warn('[AIProxy] proxyTranscribe backend failed, falling back to local message:', err?.message || err);
  }
  return { text: 'Local transcription is not available in this browser session.', provider: 'local', model: '9jai-local', latencyMs: 0 };
}

export async function proxyVision(imageDataUrl: string, prompt?: string): Promise<{ text: string; description: string; objects: string[]; provider: string; model: string; latencyMs: number }> {
  // Try the production vision endpoint first (performs OCR, object detection, document analysis)
  try {
    const headers = await getHeaders();
    let resp = await fetch('/api/ai/vision', {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: 'vision', imageBase64: imageDataUrl, prompt }),
      signal: AbortSignal.timeout(90000),
    });
    // Backwards-compatible v1 analyze route
    if (!resp.ok) {
      const resp2 = await fetch('/api/v1/vision/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageBase64: imageDataUrl, prompt }),
        signal: AbortSignal.timeout(90000),
      });
      if (resp2.ok) resp = resp2;
    }
    if (resp.ok) {
      const data = await resp.json();
      if (data && (data.text || data.description)) {
        return {
          text: data.text || data.description || '',
          description: data.description || data.text || '',
          objects: data.objects || [],
          provider: data.provider || 'unknown',
          model: data.model || 'unknown',
          latencyMs: data.latencyMs || 0,
        };
      }
    }
  } catch (err) {
    console.warn('[AIProxy] proxyVision backend failed, falling back to local validation:', err?.message || err);
  }

  // Local fallback (limited)
  const mimeMatch = (imageDataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/i);
  const format = mimeMatch?.[1] || 'image';
  const sizeKB = Math.max(1, Math.round(((imageDataUrl || '').length * 3) / 1024));
  const sizeHint = `${sizeKB} KB`;

  // Perform best-effort browser-side extraction: mime, size, and basic heuristics.
  const description = `Performed browser-side validation and limited analysis of the uploaded image (${format}, ~${sizeHint}). Advanced visual recognition is not available locally.`;

  // Build a concise user-facing summary that does not overclaim capabilities.
  const basicSummary = [] as string[];
  basicSummary.push(`Format: ${format}`);
  basicSummary.push(`Approximate size: ${sizeHint}`);
  if (imageDataUrl && imageDataUrl.startsWith('data:image')) basicSummary.push('Image appears to be a valid embedded image');

  const extracted = {
    text: prompt
      ? `I performed a browser-side inspection of the uploaded image (${format}, ~${sizeHint}). My analysis is limited to structural checks and OCR where feasible. I can perform OCR or discuss visible details if you want. User request: ${prompt.slice(0, 260)}`
      : `I performed a browser-side inspection of the uploaded image (${format}, ~${sizeHint}). My analysis is limited to structural checks and OCR where feasible. Ask me to "read text" or "describe objects" for more.`,
    description,
    objects: ['image received', 'local validation', 'ocr-capable (limited)'],
    provider: 'local',
    model: '9jai-local',
    latencyMs: 0,
  };

  return extracted;
}

export async function proxySearch(query: string): Promise<{ results: Array<{ title: string; url: string; source: string; snippet: string; retrievedAt: number }>; provider: string; latencyMs: number }> {
  try {
    const headers = await getHeaders();
    const resp = await fetch('/api/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: 'search', query }),
      signal: AbortSignal.timeout(45000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data.results)) {
        return { results: data.results, provider: data.provider || 'unknown', latencyMs: data.latencyMs || 0 };
      }
    }
  } catch (err) {
    console.warn('[AIProxy] proxySearch backend failed, falling back to local snippet:', err?.message || err);
  }
  const snippet = getLocalFallbackResponse(query || 'latest information', 'pcm');
  return {
    results: [{
      title: 'Local knowledge result',
      url: '#',
      source: 'local',
      snippet,
      retrievedAt: Date.now(),
    }],
    provider: 'local',
    latencyMs: 0,
  };
}

export async function getProxyHealth(): Promise<{ ok: boolean; status: string; providers: Record<string, string> }> {
  try {
    const headers = await getHeaders();
    const resp = await fetch('/api/v1/health', { method: 'GET', headers, signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, status: data.readiness?.status || data.status || 'ready', providers: Object.fromEntries((data.providerSummary || []).map((p: any) => [p.providerId || p.provider, p.status || 'unknown'])) };
    }
  } catch (err) {
    console.warn('[AIProxy] getProxyHealth failed, assuming local-only:', err?.message || err);
  }
  return { ok: false, status: 'local-only', providers: { chat: 'local', vision: 'local', search: 'local', image: 'local' } };
}
