/**
 * Image generation service.
 * The app works offline using a local/procedural visual fallback.
 */

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  generatedAt: number;
  model: string;
  provider?: string;
  metadata?: Record<string, any> | null;
}

export type GenerationStage =
  | 'analyzing'
  | 'parsing'
  | 'expanding'
  | 'planning'
  | 'generating_candidates'
  | 'validating'
  | 'refining'
  | 'rendering';

export function buildFinalImagePrompt(rawPrompt: string, opts?: { location?: string }): string {
  const trimmed = (rawPrompt || '').trim();
  if (!trimmed) return '9JAI local concept illustration';
  return `${trimmed}${opts?.location ? ` in ${opts.location}` : ''}, polished educational illustration, vibrant African colors, clean composition`;
}

export async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch('/api/v1/image/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.imageBase64 || null;
  } catch (err) {
    console.warn('[ImageService] fetchImageAsBase64 failed:', err);
    return null;
  }
}

export function buildPollinationsImageUrl(prompt: string, width = 1024, height = 1024): string {
  const normalized = (prompt || '').trim() || '3D concept art illustration';
  const safePrompt = normalized
    .replace(/\s+/g, ' ')
    .replace(/[<>"']/g, '')
    .slice(0, 180);
  
  // Use unique timestamp to avoid caching
  const timestamp = Date.now();
  const seed = Math.floor(Math.random() * 1000000);
  
  // Try Pollinations with proper encoding
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&_=${timestamp}`;
}

function toSvgDataUrl(label: string): string {
  const safe = (label || '9JAI visual concept').replace(/[<>&"']/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0d4d3d"/>
          <stop offset="100%" stop-color="#1ec38b"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="#061b16"/>
      <circle cx="512" cy="270" r="170" fill="url(#g)" opacity="0.8"/>
      <rect x="190" y="470" width="644" height="260" rx="36" fill="#0f2f27" stroke="#57d19f" stroke-width="10"/>
      <path d="M260 620h520" stroke="#8ef0c6" stroke-width="18" stroke-linecap="round"/>
      <path d="M260 700h410" stroke="#8ef0c6" stroke-width="18" stroke-linecap="round"/>
      <text x="512" y="118" font-size="42" fill="#e6fff7" font-family="Arial, sans-serif" text-anchor="middle">9JAI local image engine</text>
      <text x="512" y="860" font-size="34" fill="#dffbf0" font-family="Arial, sans-serif" text-anchor="middle">${safe.slice(0, 110)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function generateImageWithFallback(prompt: string): Promise<string> {
  const enhancedPrompt = buildFinalImagePrompt(prompt);
  return toSvgDataUrl(enhancedPrompt);
}

// Professional design composite engine — renders exact provided text blocks onto a generated background.
export async function generateDesignImage(prompt: string, textBlocks?: { type?: string; text: string; size?: number; weight?: string; align?: 'left'|'center'|'right' }[], width = 1200, height = 1600, backgroundUrl?: string): Promise<string> {
  // If backgroundUrl provided, use it; otherwise generate a background via fallback
  const bg = backgroundUrl || await generateImageWithFallback(prompt || 'professional background');

  // Build SVG that composes background image and overlays text blocks with exact text
  const safeBlocks = (textBlocks || []).map(b => ({ text: (b.text||'').replace(/[<>&"']/g, ''), size: b.size || 36, weight: b.weight || '700', align: b.align || 'center', type: b.type || 'body' }));

  const textSvg = safeBlocks.map((b, i) => {
    const fontSize = Math.max(18, Math.min(120, b.size));
    const y = Math.round(140 + i * (fontSize + 18));
    const anchor = b.align === 'left' ? 'start' : b.align === 'right' ? 'end' : 'middle';
    const x = b.align === 'left' ? 80 : b.align === 'right' ? (width - 80) : Math.round(width / 2);
    const fill = i === 0 ? '#ffffff' : '#f0fff5';
    return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${b.weight}" fill="${fill}" font-family="Inter, Arial, sans-serif" text-anchor="${anchor}">${b.text}</text>`;
  }).join('\n');

  const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <defs>\n    <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">\n      <feGaussianBlur stdDeviation="2" />\n    </filter>\n  </defs>\n  <image href="${bg}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />\n  <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(0,0,0,0.2)" />\n  <g>${textSvg}</g>\n</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function generateImage(prompt: string, options?: { preferredProviders?: string[]; allowFallback?: boolean }, onStage?: (stage: GenerationStage) => void): Promise<GeneratedImage> {
  onStage?.('analyzing');
  await new Promise((resolve) => setTimeout(resolve, 200));
  onStage?.('expanding');

  // Call backend canonical generation endpoint. Backend decides provider (ComfyUI authoritative when enabled).
  try {
    onStage?.('planning');
    // Attach Firebase ID token for authenticated backend calls
    let headers: Record<string,string> = { 'Content-Type': 'application/json' };
    try {
      // Lazy import to avoid circular dependencies
      const { auth } = await import('./firebase');
      if (auth?.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (tokenErr) {
      // If token acquisition fails, proceed without Authorization header — backend will reject if required
    }

    const response = await fetch('/api/v1/image/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Generation failed');
    }

    // If backend returned a generationId, client should poll status to obtain the image URL
    if (data.generationId) {
      // Return a placeholder record with generationId in id so UI can poll /api/images/status/:id
      return {
        id: data.generationId,
        prompt,
        imageUrl: '',
        generatedAt: Date.now(),
        model: data.provider || 'comfyui',
      };
    }

    // If backend returned immediate imageUrl (legacy fallback), return it
    if (data.imageUrl) {
      return {
        id: `img_${Date.now()}`,
        prompt,
        imageUrl: data.imageUrl,
        generatedAt: Date.now(),
        model: data.model || data.provider || 'unknown',
      };
    }

    throw new Error('No imageUrl or generationId returned');
  } catch (err: any) {
    console.warn('[ImageService] generateImage failed:', err?.message || err);
    // Surface the error to the caller so the UI can show an honest failure and provenance.
    throw err;
  }
}

export async function generateMultipleImages(prompts: string[], onProgress?: (current: number, total: number) => void): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];
  for (let i = 0; i < prompts.length; i++) {
    images.push(await generateImage(prompts[i]));
    onProgress?.(i + 1, prompts.length);
  }
  return images;
}

export function getImageHistory(): GeneratedImage[] {
  try {
    const data = localStorage.getItem('image_generation_history');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveImageToHistory(image: GeneratedImage): void {
  try {
    const history = getImageHistory();
    history.unshift(image);
    if (history.length > 50) history.pop();
    localStorage.setItem('image_generation_history', JSON.stringify(history));
  } catch {
    // best effort only
  }
}

export function downloadImage(imageUrl: string, filename: string): void {
  try {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // best effort only
  }
}

export async function shareImage(imageUrl: string, title: string): Promise<void> {
  try {
    if (navigator.share) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${title}.png`, { type: 'image/png' });
      await navigator.share({ title, files: [file] });
    } else {
      await navigator.clipboard.writeText(imageUrl);
    }
  } catch {
    // best effort only
  }
}

export async function generateImageVariations(basePrompt: string, variations: number = 3): Promise<GeneratedImage[]> {
  const prompts = Array.from({ length: variations }, (_, i) => `${basePrompt} (variation ${i + 1})`);
  return generateMultipleImages(prompts);
}

export async function enhancePrompt(prompt: string): Promise<string> {
  if (!prompt || !prompt.trim()) return prompt;
  return `${prompt.trim()}, polished concept art, clean educational composition, African-inspired palette, high contrast`;
}
