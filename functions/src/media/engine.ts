import type { ProviderId } from '../types';
import { pollinationsWithFallback } from '../providers/pollinations';
// Note: HuggingFace Inference API has free tier with rate limits
// If you want truly free (no API key), remove video generation
import { huggingfaceVideo } from '../providers/huggingface';

export interface MediaGenerationRequest {
  kind: 'image' | 'video' | 'audio' | 'text-to-video';
  prompt?: string;
  preferredProviders?: ProviderId[];
}

export interface MediaGenerationResult {
  kind: 'image' | 'video' | 'audio' | 'text-to-video';
  provider: ProviderId;
  model: string;
  latencyMs: number;
  imageBase64?: string;
  mediaUrl?: string;
}

export async function generateMedia(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
  const startTime = Date.now();
  
  // Handle image generation - FREE ONLY (Pollinations)
  if (request.kind === 'image' && request.prompt) {
    // Use only FREE provider: Pollinations (no API key, no cost)
    const providers = [
      { 
        name: 'pollinations', 
        fn: async () => {
          const result = await pollinationsWithFallback(request.prompt!);
          return { imageBase64: result.imageBase64, imageUrl: result.url, model: result.model };
        }
      },
    ];

    for (const provider of providers) {
      try {
        console.log(`[MediaEngine] Trying ${provider.name} for image generation`);
        const result = await provider.fn();
        
        if (result && (result.imageUrl || result.imageBase64)) {
          const latencyMs = Date.now() - startTime;
          console.log(`[MediaEngine] Success with ${provider.name} in ${latencyMs}ms`);
          
          return {
            kind: 'image',
            provider: provider.name as ProviderId,
            model: result.model || provider.name,
            latencyMs,
            imageBase64: result.imageBase64,
            mediaUrl: result.imageUrl,
          };
        }
      } catch (error: any) {
        console.warn(`[MediaEngine] ${provider.name} failed:`, error.message);
        continue;
      }
    }
  }

  // Handle video generation (text-to-video)
  if (request.kind === 'text-to-video' && request.prompt) {
    // Try FREE Pollinations video first
    try {
      console.log('[MediaEngine] Trying Pollinations for video generation (FREE)');
      const { pollinationsVideo } = await import('../providers/pollinations');
      const result = await pollinationsVideo(request.prompt);
      const latencyMs = Date.now() - startTime;
      console.log(`[MediaEngine] Success with Pollinations in ${latencyMs}ms`);
      
      return {
        kind: 'text-to-video',
        provider: 'pollinations',
        model: result.model,
        latencyMs,
        mediaUrl: result.videoUrl,
      };
    } catch (pollinationsErr: any) {
      console.warn('[MediaEngine] Pollinations video failed:', pollinationsErr.message);
      
      // Fallback to HuggingFace if available
      try {
        console.log('[MediaEngine] Trying HuggingFace for video generation');
        const result = await huggingfaceVideo(request.prompt);
        const latencyMs = Date.now() - startTime;
        console.log(`[MediaEngine] Success with HuggingFace in ${latencyMs}ms`);
        
        return {
          kind: 'text-to-video',
          provider: 'huggingface',
          model: result.model,
          latencyMs,
          mediaUrl: result.videoUrl,
        };
      } catch (hfErr: any) {
        console.error('[MediaEngine] HuggingFace video failed:', hfErr.message);
        throw new Error(`Video generation failed: ${hfErr.message}`);
      }
    }
  }

  throw new Error(`${request.kind} generation is unavailable: no provider returned a real output`);
}
