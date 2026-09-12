/**
 * Client-side proxy helpers for 9JAI.
 * All network calls remain optional and the app prefers the local engine.
 */

import { auth } from './firebase';
import { getLocalFallbackResponse } from './fallbackResponses';
import { buildPollinationsImageUrl } from './imageService';
import { detectTextInImage } from './ocr';

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
  targetLanguage?: string;
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
  const baseFallback = fallbackText ?? getLocalFallbackResponse((last?.content ?? 'How can I help?'), languageCode);
  const text = `Local fallback mode is active. No live provider responded for this request. ${baseFallback}`;
  return { text, provider: 'local', model: '9jai-local', latencyMs: 0, cached: false, fromFallback: true, error: 'No live provider responded; fallback mode is active.' };
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
        targetLanguage: options.targetLanguage,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Chat proxy ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = (await response.json()) as ProxyChatResult;
    console.log('[AIProxy] Received response from backend:', { 
      status: response.status, 
      hasText: !!data.text,
      provider: data.provider,
      textLength: data.text?.length,
      fullData: data
    });
    if (!data.text) throw new Error('Empty response from proxy');
    return data;
  } catch (err: any) {
    console.error('[AIProxy] proxyChat failed, using local fallback:', err?.message || err, err);
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
      signal: AbortSignal.timeout(120000),
    });
    if (!resp.ok) {
      // fallback to v1 compatibility route
      resp = await fetch('/api/v1/image/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, preferredProviders }),
        signal: AbortSignal.timeout(120000),
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

  const remote = buildPollinationsImageUrl(prompt || '3D concept art illustration');
  return { imageUrl: remote, provider: 'pollinations', model: 'flux', latencyMs: 0 };
}

export async function proxyVideo(prompt: string, imageDataUrl?: string): Promise<{ outputUrl: string; videoUrl?: string; provider: string; model: string; latencyMs: number }> {
  // Try backend video endpoint if available
  try {
    const headers = await getHeaders();
    const resp = await fetch('/api/v1/video', {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: 'video', prompt, imageDataUrl }),
      signal: AbortSignal.timeout(180000),
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
      signal: AbortSignal.timeout(180000),
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

function buildLocalVisualFallback(prompt?: string, language?: string): any {
  const topic = (prompt || 'visual concept').trim() || 'visual concept';
  const shortTopic = topic.length > 80 ? `${topic.slice(0, 77)}...` : topic;
  const title = /\b(diagram|chart|graph|map|timeline|flow|process|mechanical|anatomy|machine|science|biology|physics|chemistry|mathematics)\b/i.test(topic)
    ? `Visual explanation: ${topic}`
    : `Diagram: ${topic}`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#051a16"/>
          <stop offset="100%" stop-color="#103c32"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <circle cx="180" cy="180" r="110" fill="#1ec38b" opacity="0.88"/>
      <circle cx="1020" cy="220" r="130" fill="#4fe1a8" opacity="0.35"/>
      <rect x="200" y="410" width="800" height="250" rx="28" fill="#0e2e29" stroke="#7be5bd" stroke-width="6"/>
      <path d="M290 505 H910" stroke="#8ef0c6" stroke-width="10" stroke-linecap="round"/>
      <path d="M290 625 H760" stroke="#8ef0c6" stroke-width="10" stroke-linecap="round"/>
      <text x="600" y="120" text-anchor="middle" fill="#eafef7" font-size="42" font-family="Arial, sans-serif" font-weight="700">9JAI visual explanation</text>
      <text x="600" y="350" text-anchor="middle" fill="#d8fff2" font-size="36" font-family="Arial, sans-serif">${shortTopic.replace(/[<>&"']/g, '')}</text>
      <text x="600" y="742" text-anchor="middle" fill="#dffbf0" font-size="32" font-family="Arial, sans-serif">local fallback diagram</text>
      <circle cx="420" cy="495" r="54" fill="#1ec38b"/>
      <circle cx="600" cy="495" r="54" fill="#5fd1ff"/>
      <circle cx="780" cy="495" r="54" fill="#f7d66d"/>
      <text x="420" y="492" text-anchor="middle" fill="#062a22" font-size="22" font-family="Arial, sans-serif" font-weight="700">1</text>
      <text x="600" y="492" text-anchor="middle" fill="#062a22" font-size="22" font-family="Arial, sans-serif" font-weight="700">2</text>
      <text x="780" y="492" text-anchor="middle" fill="#062a22" font-size="22" font-family="Arial, sans-serif" font-weight="700">3</text>
      <path d="M474 495 H546 M654 495 H726" stroke="#dffbf0" stroke-width="8" stroke-linecap="round"/>
      <text x="420" y="575" text-anchor="middle" fill="#eafef7" font-size="18" font-family="Arial, sans-serif">Input</text>
      <text x="600" y="575" text-anchor="middle" fill="#eafef7" font-size="18" font-family="Arial, sans-serif">Process</text>
      <text x="780" y="575" text-anchor="middle" fill="#eafef7" font-size="18" font-family="Arial, sans-serif">Result</text>
    </svg>
  `;

  return {
    imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    imageType: 'educational-diagram',
    title,
    labels: [
      { id: 'label-1', label: 'Input', description: 'Beginning concept or source idea', x: 260, y: 420, width: 160, height: 120 },
      { id: 'label-2', label: 'Process', description: 'Core mechanism or cause and effect', x: 520, y: 420, width: 160, height: 120 },
      { id: 'label-3', label: 'Outcome', description: 'Final result or understanding', x: 780, y: 420, width: 160, height: 120 },
    ],
    steps: [
      'Identify the main concept or topic.',
      'Explain the process or relationships.',
      'Summarize the result or takeaway.'
    ],
    sourceType: 'local-fallback',
    provider: 'local',
    model: '9jai-local',
    description: `A simple local visual explanation for: ${topic}`,
    language: language || 'en',
  };
}

export async function proxyVisualOrchestrator(options: { prompt?: string; messages?: any[]; imageBase64?: string; imageUrl?: string; preferredProviders?: string[]; selectedLanguage?: string; responseLanguage?: string; conversationLanguage?: string; }): Promise<{ ok: boolean; visual?: any; error?: string }> {
  try {
    const headers = await getHeaders();
    const resp = await fetch('/api/v1/visual-orchestrator', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: options.prompt,
        messages: options.messages,
        imageBase64: options.imageBase64,
        imageUrl: options.imageUrl,
        preferredProviders: options.preferredProviders,
        selectedLanguage: options.selectedLanguage,
        responseLanguage: options.responseLanguage,
        conversationLanguage: options.conversationLanguage,
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { ok: false, error: `Image generation is currently unavailable: ${text.slice(0, 200) || 'no upstream provider responded.'}` };
    }
    const data = await resp.json();
    if (data?.visual) return { ok: true, visual: data.visual };
    return { ok: false, error: 'Image generation did not return a valid visual result.' };
  } catch (err: any) {
    console.warn('[AIProxy] proxyVisualOrchestrator failed:', err?.message || err);
    return { ok: false, error: 'Image generation is currently unavailable because no provider responded.' };
  }
}

function buildVisionUnavailableResult(prompt?: string): { text: string; description: string; objects: string[]; provider: string; model: string; latencyMs: number } {
  const reason = prompt
    ? `Vision analysis is unavailable in this environment. No configured vision provider responded for: "${prompt.slice(0, 180)}".`
    : 'Vision analysis is unavailable in this environment. No configured vision provider responded.';

  return {
    text: reason,
    description: 'Vision analysis is unavailable because no backend vision provider responded in this local environment.',
    objects: [],
    provider: 'unavailable',
    model: 'unavailable',
    latencyMs: 0,
  };
}

export async function proxyVision(imageDataUrl: string, prompt?: string): Promise<{ text: string; description: string; objects: string[]; provider: string; model: string; latencyMs: number }> {
  const unavailable = buildVisionUnavailableResult(prompt);

  try {
    const headers = await getHeaders();
    let resp = await fetch('/api/ai/vision', {
      method: 'POST',
      headers,
      body: JSON.stringify({ task: 'vision', imageBase64: imageDataUrl, prompt }),
      signal: AbortSignal.timeout(90000),
    });
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
      if (data?.error) {
        console.warn('[AIProxy] backend vision returned an error:', data.error);
        return unavailable;
      }
      if (data && (data.text || data.description)) {
        const providerName = data.provider || 'unknown';
        const modelName = data.model || 'unknown';
        const textWithMeta = `${data.text || data.description || ''}\n\n[Vision provider: ${providerName}; model: ${modelName}]`;
        return {
          text: textWithMeta,
          description: data.description || data.text || '',
          objects: data.objects || [],
          provider: providerName,
          model: modelName,
          latencyMs: data.latencyMs || 0,
        };
      }
    }
  } catch (err) {
    console.warn('[AIProxy] proxyVision backend failed:', err?.message || err);
    return unavailable;
  }

  return unavailable;
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
