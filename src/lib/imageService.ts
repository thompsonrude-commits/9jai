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

export async function generateImage(prompt: string, onStage?: (stage: GenerationStage) => void): Promise<GeneratedImage> {
  onStage?.('analyzing');
  await new Promise((resolve) => setTimeout(resolve, 200));
  onStage?.('expanding');
  const imageUrl = await generateImageWithFallback(prompt);
  onStage?.('rendering');
  return {
    id: `img_local_${Date.now()}`,
    prompt,
    imageUrl,
    generatedAt: Date.now(),
    model: 'local',
  };
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
