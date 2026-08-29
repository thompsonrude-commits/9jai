/**
 * NEW IMAGE GENERATION ENGINE - Complete Rewrite
 * Supports: Regular images, flyers, logos, business cards, letterheads, ads, embossed designs
 * Features: Text on images, multiple providers, fallbacks
 */

export interface ImageGenerationRequest {
  prompt: string;
  type?: 'regular' | 'flyer' | 'logo' | 'business-card' | 'letterhead' | 'ad' | 'banner' | 'poster';
  textOverlay?: {
    title?: string;
    subtitle?: string;
    body?: string;
    footer?: string;
  };
  style?: 'realistic' | 'illustration' | 'professional' | 'artistic' | '3d' | 'minimalist';
  dimensions?: { width: number; height: number };
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl: string;
  provider: string;
  model: string;
  error?: string;
}

// Multiple image generation providers for reliability
const PROVIDERS = {
  pollinations: 'https://image.pollinations.ai/prompt',
  huggingface: 'https://api-inference.huggingface.co/models',
  replicate: 'https://replicate.com/api',
};

/**
 * Enhance prompt based on image type and style
 */
function enhancePromptForType(request: ImageGenerationRequest): string {
  const { prompt, type, style } = request;
  
  let enhanced = prompt;
  
  // Add type-specific enhancements
  switch (type) {
    case 'logo':
      enhanced = `professional logo design: ${prompt}, vector style, clean, modern, simple, iconic, transparent background`;
      break;
    case 'flyer':
      enhanced = `professional flyer design: ${prompt}, eye-catching, promotional, marketing material, clean layout, vibrant colors`;
      break;
    case 'business-card':
      enhanced = `professional business card design: ${prompt}, elegant, corporate, minimal, contact information layout`;
      break;
    case 'letterhead':
      enhanced = `professional letterhead design: ${prompt}, corporate identity, formal, elegant header, business document`;
      break;
    case 'ad':
      enhanced = `advertising design: ${prompt}, attention-grabbing, commercial, marketing, promotional, call to action`;
      break;
    case 'banner':
      enhanced = `banner design: ${prompt}, wide format, promotional, eye-catching, bold typography`;
      break;
    case 'poster':
      enhanced = `poster design: ${prompt}, large format, artistic, promotional, impactful, bold visuals`;
      break;
    default:
      enhanced = prompt;
  }
  
  // Add style enhancements
  switch (style) {
    case 'realistic':
      enhanced += ', photorealistic, high detail, professional photography';
      break;
    case 'illustration':
      enhanced += ', digital illustration, artistic, vibrant colors, illustrated style';
      break;
    case 'professional':
      enhanced += ', professional quality, clean, corporate, business style';
      break;
    case 'artistic':
      enhanced += ', artistic, creative, expressive, unique style';
      break;
    case '3d':
      enhanced += ', 3D rendered, CGI, modern, depth, dimensional';
      break;
    case 'minimalist':
      enhanced += ', minimalist, simple, clean lines, modern, elegant';
      break;
  }
  
  return enhanced;
}

/**
 * Get dimensions based on image type
 */
function getDimensionsForType(type: string, custom?: { width: number; height: number }): { width: number; height: number } {
  if (custom) return custom;
  
  switch (type) {
    case 'logo':
      return { width: 512, height: 512 };
    case 'business-card':
      return { width: 1050, height: 600 };
    case 'letterhead':
      return { width: 816, height: 1056 };
    case 'flyer':
      return { width: 816, height: 1056 };
    case 'banner':
      return { width: 1200, height: 400 };
    case 'poster':
      return { width: 1080, height: 1920 };
    case 'ad':
      return { width: 1080, height: 1080 };
    default:
      return { width: 1024, height: 1024 };
  }
}

/**
 * Generate image with text overlay
 */
function createImageWithText(
  baseImageUrl: string, 
  textOverlay: NonNullable<ImageGenerationRequest['textOverlay']>,
  dimensions: { width: number; height: number }
): string {
  const { width, height } = dimensions;
  const { title, subtitle, body, footer } = textOverlay;
  
  // Create SVG with background image and text overlay
  const textElements: string[] = [];
  let yOffset = 100;
  
  // Title
  if (title) {
    textElements.push(`
      <text x="${width/2}" y="${yOffset}" 
        font-size="64" font-weight="bold" 
        fill="#ffffff" text-anchor="middle" 
        font-family="Arial, sans-serif"
        stroke="#000000" stroke-width="2" paint-order="stroke">
        ${escapeXml(title)}
      </text>
    `);
    yOffset += 100;
  }
  
  // Subtitle
  if (subtitle) {
    textElements.push(`
      <text x="${width/2}" y="${yOffset}" 
        font-size="36" font-weight="600" 
        fill="#f0f0f0" text-anchor="middle" 
        font-family="Arial, sans-serif"
        stroke="#000000" stroke-width="1" paint-order="stroke">
        ${escapeXml(subtitle)}
      </text>
    `);
    yOffset += 80;
  }
  
  // Body text (multi-line)
  if (body) {
    const lines = wrapText(body, 40);
    lines.forEach((line, idx) => {
      textElements.push(`
        <text x="${width/2}" y="${yOffset + (idx * 40)}" 
          font-size="28" 
          fill="#ffffff" text-anchor="middle" 
          font-family="Arial, sans-serif"
          stroke="#000000" stroke-width="1" paint-order="stroke">
          ${escapeXml(line)}
        </text>
      `);
    });
    yOffset += lines.length * 40 + 60;
  }
  
  // Footer
  if (footer) {
    textElements.push(`
      <text x="${width/2}" y="${height - 60}" 
        font-size="24" 
        fill="#e0e0e0" text-anchor="middle" 
        font-family="Arial, sans-serif"
        stroke="#000000" stroke-width="1" paint-order="stroke">
        ${escapeXml(footer)}
      </text>
    `);
  }
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
    </filter>
  </defs>
  
  <!-- Background Image -->
  <image href="${baseImageUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- Semi-transparent overlay for text readability -->
  <rect width="${width}" height="${height}" fill="rgba(0,0,0,0.3)"/>
  
  <!-- Text Elements -->
  <g filter="url(#shadow)">
    ${textElements.join('\n')}
  </g>
</svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Helper: Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper: Wrap text into lines
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

/**
 * Generate image URL from Pollinations
 */
function generatePollinationsUrl(prompt: string, dimensions: { width: number; height: number }): string {
  const { width, height } = dimensions;
  const seed = Date.now() + Math.floor(Math.random() * 1000000);
  const timestamp = Date.now();
  
  // Clean and encode prompt
  const safePrompt = prompt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>"']/g, '')
    .slice(0, 180);
  
  const encodedPrompt = encodeURIComponent(safePrompt);
  
  // Use format that works: /prompt/ instead of just /
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&_=${timestamp}`;
}

/**
 * Try Hugging Face Image Generation API
 */
async function tryHuggingFaceGeneration(prompt: string, dimensions: { width: number; height: number }): Promise<string | null> {
  try {
    // Use Stable Diffusion via Hugging Face Inference API
    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: dimensions.width,
          height: dimensions.height,
        }
      })
    });
    
    if (!response.ok) {
      console.log('[NewImageEngine] HuggingFace failed:', response.status);
      return null;
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('[NewImageEngine] HuggingFace error:', err);
    return null;
  }
}

/**
 * Try alternative AI image generation services
 */
async function tryAlternativeProviders(prompt: string, dimensions: { width: number; height: number }): Promise<string | null> {
  // Try Hugging Face
  const hfResult = await tryHuggingFaceGeneration(prompt, dimensions);
  if (hfResult) return hfResult;
  
  // Could add more providers here
  return null;
}

/**
 * Create fallback image (SVG-based)
 */
function createFallbackImage(request: ImageGenerationRequest): string {
  const dimensions = getDimensionsForType(request.type || 'regular', request.dimensions);
  const { width, height } = dimensions;
  const { prompt, type, textOverlay } = request;
  
  const colors = {
    logo: ['#1e40af', '#3b82f6'],
    flyer: ['#dc2626', '#f59e0b'],
    'business-card': ['#1f2937', '#6b7280'],
    letterhead: ['#0f766e', '#14b8a6'],
    ad: ['#7c3aed', '#a78bfa'],
    banner: ['#ea580c', '#fb923c'],
    poster: ['#be123c', '#fb7185'],
    regular: ['#059669', '#10b981'],
  };
  
  const [color1, color2] = colors[type as keyof typeof colors] || colors.regular;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#grad)"/>
  
  <!-- Decorative elements -->
  <circle cx="${width * 0.2}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.15}" 
    fill="white" opacity="0.1"/>
  <circle cx="${width * 0.8}" cy="${height * 0.7}" r="${Math.min(width, height) * 0.12}" 
    fill="white" opacity="0.1"/>
  
  <!-- Type label -->
  <text x="${width/2}" y="60" font-size="24" fill="white" opacity="0.8" 
    text-anchor="middle" font-family="Arial, sans-serif" font-weight="600">
    ${escapeXml(type?.toUpperCase() || 'IMAGE')}
  </text>
  
  <!-- Main text -->
  <text x="${width/2}" y="${height/2}" font-size="${type === 'logo' ? '48' : '36'}" 
    fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">
    ${escapeXml(prompt.substring(0, 30))}
  </text>
  
  ${textOverlay?.title ? `
    <text x="${width/2}" y="${height - 100}" font-size="32" fill="white" 
      text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">
      ${escapeXml(textOverlay.title)}
    </text>
  ` : ''}
  
  <!-- Footer -->
  <text x="${width/2}" y="${height - 40}" font-size="18" fill="white" opacity="0.7" 
    text-anchor="middle" font-family="Arial, sans-serif">
    Powered by 9JAI
  </text>
</svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * MAIN: Generate Image
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  console.log('[NewImageEngine] Starting generation:', request);
  
  try {
    // Step 1: Enhance prompt
    const enhancedPrompt = enhancePromptForType(request);
    console.log('[NewImageEngine] Enhanced prompt:', enhancedPrompt);
    
    // Step 2: Get dimensions
    const dimensions = getDimensionsForType(request.type || 'regular', request.dimensions);
    console.log('[NewImageEngine] Dimensions:', dimensions);
    
    // Step 3: Try backend providers first (Gemini via backend) when available
    let baseImageUrl: string | undefined;
    let provider = 'placeholder';
    let model = 'unknown';

    try {
      // Attempt server-side image generation route which will prefer Gemini when configured
      console.log('[NewImageEngine] Trying backend image generation via /api/ai/image');
      // Prefer the canonical v1 image generation route which runs the full orchestration
      let resp = await fetch('/api/v1/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: enhancedPrompt, allowFallback: true }),
        signal: AbortSignal.timeout(180000),
      });

      if (!resp.ok) {
        // Fallback to the simpler /api/ai/image if v1 isn't available
        console.warn('[NewImageEngine] /api/v1/image/generate failed, trying /api/ai/image');
        resp = await fetch('/api/ai/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: enhancedPrompt, width: dimensions.width, height: dimensions.height }),
          signal: AbortSignal.timeout(120000),
        });
      }

      if (resp.ok) {
        const data = await resp.json();
        // Expecting { imageBase64?, mediaUrl?, provider, model }
        if (data?.imageBase64) {
          baseImageUrl = data.imageBase64;
          provider = data.provider || 'backend';
          model = data.model || 'backend-model';
          console.log('[NewImageEngine] Backend returned base64 image from', provider, model);
        } else if (data?.mediaUrl || data?.imageUrl || data?.mediaUrl) {
          baseImageUrl = data.mediaUrl || data.imageUrl || data.imageUrl;
          provider = data.provider || 'backend';
          model = data.model || 'backend-model';
          console.log('[NewImageEngine] Backend returned mediaUrl from', provider, model);
        } else {
          console.warn('[NewImageEngine] Backend responded but did not return an image, falling back');
        }
      } else {
        const txt = await resp.text().catch(() => '');
        console.warn('[NewImageEngine] Backend image route failed:', resp.status, txt.slice(0,200));
      }
    } catch (err) {
      console.warn('[NewImageEngine] Backend image generation attempt failed:', err);
    }

    // If backend didn't provide an image, fall back to Pollinations (remote) as a clearly labeled fallback
    if (!baseImageUrl) {
      baseImageUrl = generatePollinationsUrl(enhancedPrompt, dimensions);
      provider = 'pollinations';
      model = 'flux';
      console.log('[NewImageEngine] Falling back to Pollinations URL:', baseImageUrl);
    }

    // Step 4: Add text overlay if requested
    let finalImageUrl = baseImageUrl;
    if (request.textOverlay && Object.keys(request.textOverlay).length > 0) {
      console.log('[NewImageEngine] Adding text overlay');
      finalImageUrl = createImageWithText(baseImageUrl, request.textOverlay, dimensions);
    }

    return {
      success: !!baseImageUrl,
      imageUrl: finalImageUrl || '',
      provider,
      model,
    };
    
  } catch (error: any) {
    console.error('[NewImageEngine] Generation failed:', error);
    
    // Return fallback on any error
    const fallbackUrl = createFallbackImage(request);
    
    return {
      success: false,
      imageUrl: fallbackUrl,
      provider: 'fallback',
      model: 'svg-generator',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Quick generate with just a prompt (convenience function)
 */
export async function quickGenerateImage(prompt: string): Promise<string> {
  const result = await generateImage({ prompt, type: 'regular' });
  return result.imageUrl;
}

/**
 * Generate specific image types (convenience functions)
 */
export async function generateLogo(businessName: string, tagline?: string): Promise<string> {
  const result = await generateImage({
    prompt: businessName,
    type: 'logo',
    style: 'professional',
    textOverlay: tagline ? { footer: tagline } : undefined,
  });
  return result.imageUrl;
}

export async function generateFlyer(
  title: string, 
  description: string, 
  callToAction?: string
): Promise<string> {
  const result = await generateImage({
    prompt: description,
    type: 'flyer',
    style: 'professional',
    textOverlay: {
      title,
      body: description,
      footer: callToAction,
    },
  });
  return result.imageUrl;
}

export async function generateBusinessCard(
  name: string,
  title: string,
  company: string,
  contact: string
): Promise<string> {
  const result = await generateImage({
    prompt: `${company} business card, professional design`,
    type: 'business-card',
    style: 'professional',
    textOverlay: {
      title: name,
      subtitle: title,
      body: company,
      footer: contact,
    },
  });
  return result.imageUrl;
}

export async function generateAd(
  product: string,
  message: string,
  callToAction: string
): Promise<string> {
  const result = await generateImage({
    prompt: `${product} advertisement, eye-catching, professional`,
    type: 'ad',
    style: 'artistic',
    textOverlay: {
      title: product,
      body: message,
      footer: callToAction,
    },
  });
  return result.imageUrl;
}
