/**
 * Pollinations AI — Professional Multi-Stage Visual Generation
 * Uses Visual Intelligence Engine for specialized rendering per image type
 */

import { scoreImageQuality, MODE_MODELS, extractBrandName } from './visualIntelligence';
import { buildEnhancedVisualRequest, VisualEnhancementRequest } from './advancedVisualIntelligence';
import { generateLogoSVG, svgToBase64DataUrl } from './logoEngine';

// Wrapper: accepts raw string, wraps into VisualEnhancementRequest
function buildVisualRequest(rawPrompt: string) {
  const req: VisualEnhancementRequest = { prompt: rawPrompt };
  return buildEnhancedVisualRequest(req);
}

export { buildVisualRequest };

// ── Fetch image bytes from Pollinations ────────────────────────────────────

async function fetchPollinationsImage(
  prompt: string,
  model: string,
  width: number,
  height: number,
  negativePrompt: string,
  seed: number,
  enhance: boolean,
  timeoutMs: number
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const encoded = encodeURIComponent(prompt);
  const negEncoded = encodeURIComponent(negativePrompt);

  const url = `https://image.pollinations.ai/prompt/${encoded}` +
    `?width=${width}&height=${height}` +
    `&model=${model}&nologo=true&seed=${seed}` +
    `&enhance=${enhance}&negative=${negEncoded}&nofeed=true`;

  console.log(`[Pollinations] ${model} ${width}x${height}: ${prompt.slice(0, 60)}...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/jpeg,image/png,image/webp,image/*',
        'User-Agent': '9jai-AI/2.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 402) {
        console.warn(`[Pollinations] Model ${model} is paid (402), skipping`);
        return null;
      }
      console.warn(`[Pollinations] HTTP ${res.status} for model ${model}`);
      return null;
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5000) {
      console.warn(`[Pollinations] Too small: ${buffer.length} bytes`);
      return null;
    }

    console.log(`[Pollinations] Success: ${buffer.length} bytes (model=${model})`);
    return { bytes: buffer, contentType };

  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') console.warn(`[Pollinations] Timeout (model=${model})`);
    else console.warn(`[Pollinations] Error: ${err.message}`);
    return null;
  }
}

// ── Main generation function ───────────────────────────────────────────────

export async function pollinationsWithFallback(
  rawPrompt: string
): Promise<{ imageBase64: string; model: string; url: string; mode: string; quality: number }> {

  const req = buildVisualRequest(rawPrompt);

  console.log(`[Visual] Mode: ${req.style} | Seeds: ${req.seeds.join(', ')}`);
  console.log(`[Visual] Enhanced: ${req.enhancedPrompt.slice(0, 80)}...`);

  // Logos: use SVG engine for perfect text rendering
  if (req.style === 'logo') {
    try {
      const svg = generateLogoSVG(extractBrandName(rawPrompt), rawPrompt);
      const dataUrl = svgToBase64DataUrl(svg);
      console.log(`[Visual] SVG Logo generated`);
      return { imageBase64: dataUrl, model: 'svg-logo-engine', url: dataUrl, mode: req.style, quality: 98 };
    } catch (err: any) {
      console.warn(`[Visual] SVG logo failed: ${err.message}`);
    }
  }

  const modelsToTry = (MODE_MODELS as Record<string, string[]>)[req.style] || ['turbo', 'stable-diffusion-3.5-large'];
  const timeouts = [40000, 50000, 35000];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const timeout = timeouts[Math.min(i, timeouts.length - 1)];
    const seed = req.seeds[i] || req.seeds[0];

    const result = await fetchPollinationsImage(
      req.enhancedPrompt, model, req.width, req.height,
      req.negativePrompt, seed, req.upscale, timeout
    );

    if (result) {
      const quality = scoreImageQuality(result.bytes.length, (req.style as any) || 'photorealistic');
      console.log(`[Visual] Quality: ${quality}/100 (${result.bytes.length} bytes, model=${model})`);

      if (quality < 25 && i < modelsToTry.length - 1) {
        console.warn(`[Visual] Quality too low (${quality}), trying next model...`);
        continue;
      }

      const base64 = result.bytes.toString('base64');
      const mimeType = result.contentType.split(';')[0].trim();
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.enhancedPrompt)}` +
        `?width=${req.width}&height=${req.height}&model=${model}&nologo=true&seed=${seed}&enhance=true`;

      return { imageBase64: dataUrl, model: `pollinations-${model}`, url: directUrl, mode: req.style, quality };
    }
  }

  throw new Error(`All Pollinations models failed for mode: ${req.style}`);
}

// ── URL-only fallback ──────────────────────────────────────────────────────

export function getPollinationsUrl(rawPrompt: string): string {
  const req = buildVisualRequest(rawPrompt);
  const encoded = encodeURIComponent(req.enhancedPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}` +
    `?width=${req.width}&height=${req.height}&model=${req.candidates[0].model}&nologo=true&seed=${req.seeds[0]}&enhance=true`;
}
