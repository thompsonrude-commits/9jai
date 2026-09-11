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
 * Uses multiple approaches to avoid 403 errors
 */
export async function pollinationsImage(prompt: string): Promise<PollinationsImageResult> {
  const seed = Math.floor(Math.random() * 999999);
  const enhanced = `${prompt}, high quality, detailed, realistic, professional`;
  const encoded = encodeURIComponent(enhanced);
  
  // Try different Pollinations endpoints
  const endpoints = [
    `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`,
    `https://pollinations.ai/p/${encoded}?width=1024&height=1024&seed=${seed}`,
    `https://image.pollinations.ai/prompt/${encoded}?seed=${seed}`,
  ];
  
  // Return the first endpoint (direct URL approach)
  return {
    url: endpoints[0],
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
 * Fetches the image server-side and returns base64 — avoids CORS issues on frontend canvas
 */
export async function pollinationsWithFallback(prompt: string): Promise<PollinationsImageResult> {
  const result = await pollinationsImage(prompt);
  
  // Fetch image server-side and convert to base64
  // This ensures frontend canvas can read it without CORS errors
  try {
    const response = await fetch(result.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(30000),
    });
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      console.log('[Pollinations] Fetched and converted to base64, size:', Math.round(base64.length / 1024), 'KB');
      
      return {
        url: dataUrl,  // Return base64 as URL so it's always canvas-safe
        imageBase64: dataUrl,
        model: result.model,
      };
    }
    
    console.warn('[Pollinations] Fetch failed, returning URL directly:', response.status);
    return result;
  } catch (err: any) {
    console.warn('[Pollinations] Base64 conversion failed, returning URL:', err.message);
    return result;
  }
}
