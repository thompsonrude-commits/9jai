import type { ProviderId } from '../types';
import { pollinationsWithFallback } from '../providers/pollinations';
import { huggingfaceVideo } from '../providers/huggingface';
import { generateImageNative, checkNativeAIAvailable, classifyImageType, enhancePromptForQuality } from './nativeAIEngine';

export interface MediaGenerationRequest {
  kind: 'image' | 'video' | 'audio' | 'text-to-video';
  prompt?: string;
  preferredProviders?: ProviderId[];
  allowFallback?: boolean;
}

export interface MediaGenerationResult {
  kind: 'image' | 'video' | 'audio' | 'text-to-video';
  provider: ProviderId;
  model: string;
  latencyMs: number;
  imageBase64?: string;
  mediaUrl?: string;
  // When a provider succeeds after one or more failures, indicate the original requested provider and reason
  fallbackFrom?: string; // e.g., 'gemini'
  fallbackReason?: string; // e.g., 'NOT_CONFIGURED' | 'AUTH_FAILED' | 'ERROR'
}

export async function generateMedia(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
  const startTime = Date.now();
  
  // Handle audio generation (local deterministic mock first)
  if (request.kind === 'audio') {
    try {
      // Try to use local deterministic mock provider if available
      try {
        const mod = await import('../providers/localAudioMock');
        const res = await mod.generateAudio(request.prompt, { lyrics: (request as any).lyrics, genre: (request as any).genre });
        const latencyMs = Date.now() - startTime;
        return {
          kind: 'audio',
          provider: 'local-audio-mock' as ProviderId,
          model: res.model || 'local-mock',
          latencyMs,
          mediaUrl: undefined,
          imageBase64: undefined,
          // Attach audioBase64 directly (caller can construct data URL)
          audioBase64: res.audioBase64 as any,
        } as any;
      } catch (innerErr) {
        console.warn('[MediaEngine] local-audio-mock not available or failed:', innerErr);
        // Fall through to provider chain if implemented later
      }
    } catch (e) {
      console.error('[MediaEngine] audio generation failed:', e);
      throw new Error('Audio generation failed');
    }
  }

  // Handle image generation
  // ARCHITECTURE: Native GPU (PRIMARY) → OpenRouter DALL-E 3 (Fallback 1) → Pollinations (Fallback 2)
  if (request.kind === 'image' && request.prompt) {
    // Improve prompt understanding: classify and enhance prompt for the best model selection and quality modifiers
    const imageType = classifyImageType(request.prompt!);
    let promptToUse = request.prompt!;
    try {
      promptToUse = enhancePromptForQuality(request.prompt!, imageType);
      console.log('[MediaEngine] Enhanced prompt for quality:', promptToUse.slice(0,200));
    } catch (e) {
      console.warn('[MediaEngine] Prompt enhancement failed, using original prompt');
    }

    // Respect configuration: when ComfyUI is explicitly enabled and configured as the image provider,
    // do NOT fall back to other providers. Fail honestly if ComfyUI is unavailable.
    const comfyMode = (process.env.COMFYUI_ENABLED === 'true') || (process.env.IMAGE_PROVIDER === 'comfyui');

    if (comfyMode) {
      try {
        // Only attempt native generation and return an explicit failure if it is unavailable
        console.log('[MediaEngine] COMFYUI mode enabled — using ComfyUI as authoritative provider');
        const available = await checkNativeAIAvailable();
        if (!available) {
          throw new Error('ComfyUI not available');
        }

        const result = await generateImageNative({ prompt: promptToUse, width: 1024, height: 1024 });
        const latencyMs = Date.now() - startTime;

        // Return canonical result
        return {
          kind: 'image',
          provider: 'native-gpu',
          model: result.model,
          latencyMs,
          imageBase64: (result as any).imageBase64,
          mediaUrl: undefined,
        } as any;
      } catch (err: any) {
        console.error('[MediaEngine] ComfyUI (authoritative) failed:', err?.message || err);
        // Per requirements, do not fall back — surface an error to caller
        throw new Error('ComfyUI image generation is currently unavailable.');
      }
    }

    // Non-Comfy mode: Gemini (PRIMARY, FREE, ChatGPT quality) → OpenRouter → Pollinations
    // Build provider list honoring preferredProviders and authoritative registry
    const defaultProviders = ['gemini', 'openrouter', 'pollinations'];

    // If caller explicitly disallowed fallback and no preferredProviders are supplied,
    // fail immediately rather than silently falling through to the default chain.
    const allowFallbackGlobal = request.allowFallback !== undefined ? request.allowFallback : true;
    if (!allowFallbackGlobal && (!request.preferredProviders || request.preferredProviders.length === 0)) {
      throw new Error('Fallback is disabled and no preferred image provider is configured.');
    }

    // If caller explicitly disallowed fallback and provided preferredProviders, perform a readiness pre-check
    if (!allowFallbackGlobal && request.preferredProviders && request.preferredProviders.length > 0) {
      try {
        const { getCompactProviderReports } = await import('./providerRegistry');
        const reports = await getCompactProviderReports();
        const byId: Record<string, any> = {};
        for (const r of reports) byId[r.providerId] = r;

        // If any explicitly requested provider is not configured/disabled/unavailable, fail fast and preserve honesty
        for (const p of request.preferredProviders) {
          const pid = String(p);
          const rep = byId[pid];
          if (!rep) {
            throw new Error(`Provider ${pid} NOT_CONFIGURED`);
          }
          const state = rep.implementationState || (rep.status ?? '').toUpperCase();
          // Consider READY or IMPLEMENTED/WIRED as acceptable; anything else means not usable
          const okStates = ['READY', 'IMPLEMENTED', 'WIRED'];
          if (!okStates.includes(String(state).toUpperCase())) {
            throw new Error(`Provider ${pid} NOT_CONFIGURED`);
          }
        }
      } catch (err: any) {
        // Surface a clear error so the caller knows no fallback is allowed and preferred provider is not usable
        throw new Error(`${err?.message || 'preferred provider not available'} — fallback is disabled`);
      }
    }

    // Build ordered provider list:
    // - If preferredProviders provided and fallback allowed: try preferred first, then append defaults
    // - If preferredProviders provided and fallback disabled: try only preferred
    // - Otherwise, use defaultProviders
    let ordered: string[] = [];
    if (request.preferredProviders && request.preferredProviders.length > 0) {
      const prefs = request.preferredProviders.map((p: any) => String(p));
      const allowFallbackLocal = request.allowFallback !== undefined ? request.allowFallback : true;
      if (allowFallbackLocal) {
        ordered = [...prefs, ...defaultProviders.filter(p => !prefs.includes(p))];
      } else {
        ordered = prefs;
      }
    } else {
      ordered = defaultProviders.slice();
    }

    // Ensure string array
    ordered = ordered.map((p: any) => String(p));


    const providers = ordered.map((name: string) => {
     if (name === 'gemini') {
       return {
         name: 'gemini',
         fn: async () => {
           console.log('[MediaEngine] PRIMARY: Trying Google Gemini image generation');
           const { geminiGenerateImage } = await import('../providers/gemini');
           const result = await geminiGenerateImage(promptToUse);
           return { imageBase64: result.imageBase64, imageUrl: result.imageBase64, model: result.model };
         }
       };
     }
     if (name === 'openrouter') {
       return {
         name: 'openrouter',
         fn: async () => {
           console.log('[MediaEngine] FALLBACK: Trying OpenRouter');
           const { openRouterImage } = await import('../providers/openrouter');
           const result = await openRouterImage(promptToUse);
           return { imageUrl: result.imageUrl, model: result.model };
         }
       };
     }
     if (name === 'pollinations') {
       return {
         name: 'pollinations',
         fn: async () => {
           console.log('[MediaEngine] FALLBACK: Trying Pollinations');
           const result = await pollinationsWithFallback(promptToUse);
           if (imageType === 'hybrid' || imageType === 'logo') {
             try {
               const companyMatch = promptToUse.match(/for\s+([A-Z][\w\s\-\,\.\&]{2,})/i) || promptToUse.match(/with the words\s+"?([^"']+)"?/i) || promptToUse.match(/include\s+the words\s+"?([^"']+)"?/i);
               const companyName = companyMatch ? companyMatch[1].trim() : null;
               if (companyName) {
                 const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]);
                 const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1024\" height=\"1024\" viewBox=\"0 0 1024 1024\">\n  <image href=\"${result.url}\" x=\"0\" y=\"0\" width=\"1024\" height=\"1024\" preserveAspectRatio=\"xMidYMid slice\" />\n  <rect x=\"0\" y=\"0\" width=\"1024\" height=\"220\" fill=\"rgba(0,0,0,0.4)\" />\n  <text x=\"512\" y=\"140\" font-family=\"Inter, Arial, sans-serif\" font-size=\"48\" fill=\"#ffffff\" font-weight=\"700\" text-anchor=\"middle\">${escapeXml(companyName)}</text>\n</svg>`;
                 const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
                 return { imageBase64: undefined, imageUrl: dataUrl, model: `${result.model}-composed` };
               }
             } catch (err) {
               console.warn('[MediaEngine] composition failed:', err);
             }
           }
           return { imageBase64: result.imageBase64, imageUrl: result.url, model: result.model };
         }
       };
     }

     // Add support for local-audio-mock provider mapping
     if (name === 'local-audio-mock') {
       return {
         name: 'local-audio-mock',
         fn: async () => {
           console.log('[MediaEngine] LOCAL MOCK: Generating audio via localAudioMock');
           const mod = await import('../providers/localAudioMock');
           const result = await mod.generateAudio(promptToUse, { lyrics: (request as any).lyrics });
           return { audioBase64: result.audioBase64, contentType: result.contentType, model: result.model } as any;
         }
       };
     }

     // Unknown provider -> fallback to pollinations behavior
     return {
       name: String(name),
       fn: async () => {
         const result = await pollinationsWithFallback(promptToUse);
         return { imageBase64: result.imageBase64, imageUrl: result.url, model: result.model };
       }
     };
    });

    // If allowFallback is explicitly false and user provided preferredProviders, restrict to those only
    const allowFallback = request.allowFallback !== undefined ? request.allowFallback : true;
    if (!allowFallback && request.preferredProviders && request.preferredProviders.length > 0) {
     // Only keep providers that were explicitly requested
     // The loop below will try them and if they fail return with error
    }


    // Track attempts for debugging
    const attemptLog: Array<{ provider: string; success: boolean; error?: string; durationMs: number }> = [];
    // Track the first provider failure so we can report why we fell back
    let firstFailure: { provider: string; reason: string } | null = null;

    for (const provider of providers) {
      const providerStart = Date.now();
      try {
        console.log(`[MediaEngine] Attempting ${provider.name}...`);
        const result = await provider.fn();
        const providerDuration = Date.now() - providerStart;
        const providerResult: any = result;
        
        // Treat a missing/empty provider result as a failure (no usable output)
        if (!providerResult || !(providerResult.imageUrl || providerResult.imageBase64)) {
          const providerDuration2 = Date.now() - providerStart;
          const errMsg = 'no usable output from provider';
          attemptLog.push({ provider: provider.name, success: false, error: errMsg, durationMs: providerDuration2 });
          console.warn(`[MediaEngine] ${provider.name} returned no usable output`);
          if (!firstFailure) {
            firstFailure = { provider: provider.name, reason: 'ERROR' };
          }

          const allowFallbackLocal = request.allowFallback !== undefined ? request.allowFallback : true;
          if (!allowFallbackLocal && request.preferredProviders && request.preferredProviders.length > 0) {
            console.warn('[MediaEngine] Fallback disabled and preferredProviders specified — stopping after first failure (no usable output)');
            throw new Error(`Provider ${provider.name} produced no usable output and fallback is disabled`);
          }

          continue;
        }

        if (providerResult && (providerResult.imageUrl || providerResult.imageBase64)) {
          const latencyMs = Date.now() - startTime;
          
          attemptLog.push({
            provider: provider.name,
            success: true,
            durationMs: providerDuration,
          });
          
          console.log(`[MediaEngine] ✓ SUCCESS with ${provider.name} in ${latencyMs}ms`);
          console.log(`[MediaEngine] Attempt log:`, JSON.stringify(attemptLog));
          
          // If this was a hybrid/logo prompt and we have a background image URL, attempt deterministic composition
          try {
            if ((imageType === 'hybrid' || imageType === 'logo') && providerResult.imageUrl) {
              const promptForMatch = promptToUse;
              const companyMatch = promptForMatch.match(/for\s+([A-Z][\w\s\-\,\.\&]{2,})/i) || promptForMatch.match(/with the words\s+"?([^"']+)"?/i) || promptForMatch.match(/include\s+the words\s+"?([^"']+)"?/i);
              const companyName = companyMatch ? companyMatch[1].trim() : null;
              if (companyName) {
                const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]);
                const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1024\" height=\"1024\" viewBox=\"0 0 1024 1024\">\n  <image href=\"${providerResult.imageUrl}\" x=\"0\" y=\"0\" width=\"1024\" height=\"1024\" preserveAspectRatio=\"xMidYMid slice\" />\n  <rect x=\"0\" y=\"0\" width=\"1024\" height=\"220\" fill=\"rgba(0,0,0,0.4)\" />\n  <text x=\"512\" y=\"140\" font-family=\"Inter, Arial, sans-serif\" font-size=\"48\" fill=\"#ffffff\" font-weight=\"700\" text-anchor=\"middle\">${escapeXml(companyName)}</text>\n</svg>`;
                const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
                return {
                  kind: 'image',
                  provider: provider.name as ProviderId,
                  model: `${providerResult.model || provider.name}-composed`,
                  latencyMs,
                  imageBase64: undefined,
                  mediaUrl: dataUrl,
                  fallbackFrom: firstFailure?.provider,
                  fallbackReason: firstFailure?.reason,
                };
              }
            }
          } catch (err) {
            console.warn('[MediaEngine] composition attempt failed:', err);
          }

          return {
            kind: 'image',
            provider: provider.name as ProviderId,
            model: providerResult.model || provider.name,
            latencyMs,
            imageBase64: providerResult.imageBase64,
            mediaUrl: providerResult.imageUrl || providerResult.imageBase64,
            fallbackFrom: firstFailure?.provider,
            fallbackReason: firstFailure?.reason,
          };
        }
      } catch (error: any) {
        const providerDuration = Date.now() - providerStart;
        // Determine normalized reason for failure
        const msg = (error?.message || '').toLowerCase();
        let reason = 'ERROR';
        if (msg.includes('not configured') || msg.includes('not found') || msg.includes('missing')) reason = 'NOT_CONFIGURED';
        if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('auth')) reason = 'AUTH_FAILED';

        attemptLog.push({
          provider: provider.name,
          success: false,
          error: error.message,
          durationMs: providerDuration,
        });
          
        console.warn(`[MediaEngine] ✗ ${provider.name} failed:`, error.message);
        if (!firstFailure) {
          firstFailure = { provider: provider.name, reason };
        }

        // If caller explicitly disallowed fallback and provided preferredProviders, stop here and surface the error
        const allowFallback = request.allowFallback !== undefined ? request.allowFallback : true;
        if (!allowFallback && request.preferredProviders && request.preferredProviders.length > 0) {
          console.warn('[MediaEngine] Fallback disabled and preferredProviders specified — stopping after first failure');
          throw new Error(`Provider ${provider.name} failed and fallback is disabled: ${error.message}`);
        }

        continue; // Try next provider
      }
    }
    
    // All providers failed
    console.error('[MediaEngine] All image providers exhausted');
    console.error('[MediaEngine] Attempt log:', JSON.stringify(attemptLog));
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
