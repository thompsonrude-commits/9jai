/**
 * ImageEngine.ts
 *
 * Handles AI-powered image generation and editing. Supports text-to-image,
 * image-to-image transforms, inpainting, and upscaling. Designed to include
 * culturally relevant African art styles as style presets.
 *
 * TODO Phase 4: Integrate DALL-E 3, Stable Diffusion, and Imagen providers
 * TODO Phase 4: Add African art style presets (Benin bronzes, Yoruba textiles, etc.)
 * TODO Phase 5: Implement provider auto-switch based on quota and quality
 */

import type { EngineOptions } from '../../utils/types';

// ---------------------------------------------------------------------------
// Generation options
// ---------------------------------------------------------------------------

export interface ImageGenerationOptions extends EngineOptions {
  width?: number;           // e.g. 1024
  height?: number;          // e.g. 1024
  style?: string;           // e.g. "photorealistic", "benin-bronze", "ankara-pattern"
  negativePrompt?: string;
  seed?: number;
  steps?: number;           // diffusion steps
  guidanceScale?: number;   // CFG scale
  provider?: string;        // override preferred provider
}

export interface ImageEditOptions extends EngineOptions {
  mask?: string | Buffer;   // mask for inpainting (base64 or Buffer)
  strength?: number;        // 0–1, how much to change the original
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface GeneratedImage {
  url?: string;             // CDN URL if hosted
  base64?: string;          // base64-encoded PNG/JPEG
  mimeType: string;
  width: number;
  height: number;
  prompt: string;
  provider: string;
  revisedPrompt?: string;   // provider may return a revised prompt
  seed?: number;
}

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface ImageEngine {
  generate(prompt: string, options?: ImageGenerationOptions): Promise<GeneratedImage>;
  edit(imageInput: string | Buffer, prompt: string, options?: ImageEditOptions): Promise<GeneratedImage>;
  upscale(imageInput: string | Buffer, factor?: 2 | 4, options?: EngineOptions): Promise<GeneratedImage>;
  availableStyles(): string[];
}

export class DefaultImageEngine implements ImageEngine {
  async generate(prompt: string): Promise<GeneratedImage> {
    return { url: `https://example.local/${prompt}`.replace(/\s+/g, '-'), mimeType: 'image/png', width: 512, height: 512, prompt, provider: 'local-image' };
  }

  async edit(imageInput: string | Buffer, prompt: string): Promise<GeneratedImage> {
    return { url: `edited:${typeof imageInput === 'string' ? imageInput : 'buffer'}`, mimeType: 'image/png', width: 512, height: 512, prompt, provider: 'local-image' };
  }

  async upscale(imageInput: string | Buffer): Promise<GeneratedImage> {
    return { url: `upscaled:${typeof imageInput === 'string' ? imageInput : 'buffer'}`, mimeType: 'image/png', width: 1024, height: 1024, prompt: 'upscaled', provider: 'local-image' };
  }

  availableStyles(): string[] {
    return ['photorealistic', 'benin-bronze', 'ankara-pattern'];
  }
}
