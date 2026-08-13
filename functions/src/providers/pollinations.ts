/**
 * Pollinations.AI - FREE image and video generation
 * https://pollinations.ai
 * 
 * NO API KEY REQUIRED - 100% FREE
 */

export interface PollinationsImageResult {
  url: string;
  imageBase64?: string;
  model: string;
}

export interface PollinationsVideoResult {
  videoUrl: string;
  model: string;
}

/**
 * Generate image with Pollinations (FREE, no API key)
 */
export async function pollinationsImage(prompt: string): Promise<PollinationsImageResult> {
  const seed = Math.floor(Math.random() * 999999);
  const enhanced = `${prompt}, high quality, detailed, realistic, professional, 4k`;
  const encoded = encodeURIComponent(enhanced);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&enhance=true`;
  
  return {
    url,
    model: 'pollinations-flux',
  };
}

/**
 * Generate video with Pollinations Seedance model (FREE, no API key)
 * Note: Video generation through free APIs is limited. This creates an animated placeholder.
 */
export async function pollinationsVideo(prompt: string, duration = 4): Promise<PollinationsVideoResult> {
  // For now, return a message explaining video generation status
  // Real video generation requires paid APIs (Luma, Runway, Pika) or complex open-source models
  
  throw new Error('Video generation is temporarily unavailable. Free video APIs are not reliable. Please use image generation or configure a paid video API (Luma, Runway, Replicate).');
}

/**
 * Fallback with image to base64 conversion
 */
export async function pollinationsWithFallback(prompt: string): Promise<PollinationsImageResult> {
  try {
    const result = await pollinationsImage(prompt);
    
    // Try to fetch and convert to base64
    try {
      const response = await fetch(result.url, {
        signal: AbortSignal.timeout(15000),
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        return {
          url: result.url,
          imageBase64: `data:${contentType};base64,${base64}`,
          model: result.model,
        };
      }
    } catch (fetchErr) {
      // If base64 conversion fails, still return the URL
      console.warn('[Pollinations] Failed to convert to base64, using URL:', fetchErr);
    }
    
    return result;
  } catch (err: any) {
    throw new Error(`Pollinations image generation failed: ${err.message}`);
  }
}
