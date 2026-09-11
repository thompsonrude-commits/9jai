/**
 * Complete Image Generation System - Fresh Implementation
 * Supports: Regular images, flyers, business ads, logos, letterheads, text on images
 */

export type ImageType = 'general' | 'flyer' | 'ad' | 'logo' | 'letterhead' | 'poster' | 'banner' | 'card';

export interface ImageRequest {
  prompt: string;
  type: ImageType;
  width?: number;
  height?: number;
  textElements?: TextElement[];
}

export interface TextElement {
  text: string;
  position: 'top' | 'center' | 'bottom' | 'custom';
  size?: number;
  color?: string;
  font?: string;
  x?: number;
  y?: number;
}

export interface ImageResult {
  success: boolean;
  imageUrl: string;
  type: ImageType;
  prompt: string;
  timestamp: number;
  error?: string;
}

/**
 * Main image generation function
 */
export async function generateImage(request: ImageRequest): Promise<ImageResult> {
  const timestamp = Date.now();
  
  try {
    console.log('[ImageGen] Starting generation:', request);
    
    // Detect type from prompt if not specified
    const detectedType = detectImageType(request.prompt);
    const finalType = request.type || detectedType;
    
    // Generate base image
    let imageUrl: string;
    
    if (request.textElements && request.textElements.length > 0) {
      // Generate image with text overlay
      imageUrl = await generateImageWithText(request);
    } else {
      // Generate regular image
      imageUrl = await generateBaseImage(request.prompt, request.width, request.height);
    }
    
    console.log('[ImageGen] Generation successful:', imageUrl);
    
    return {
      success: true,
      imageUrl,
      type: finalType,
      prompt: request.prompt,
      timestamp,
    };
  } catch (error: any) {
    console.error('[ImageGen] Generation failed:', error);
    
    // Return fallback SVG
    const fallbackUrl = generateFallbackSVG(request.prompt, request.width, request.height);
    
    return {
      success: false,
      imageUrl: fallbackUrl,
      type: request.type || 'general',
      prompt: request.prompt,
      timestamp,
      error: error.message || 'Generation failed',
    };
  }
}

/**
 * Detect image type from prompt keywords
 */
function detectImageType(prompt: string): ImageType {
  const lower = prompt.toLowerCase();
  
  if (/\b(flyer|flier|event|invitation)\b/i.test(lower)) return 'flyer';
  if (/\b(ad|advertisement|promote|promotion)\b/i.test(lower)) return 'ad';
  if (/\b(logo|brand|emblem|symbol)\b/i.test(lower)) return 'logo';
  if (/\b(letterhead|header|official)\b/i.test(lower)) return 'letterhead';
  if (/\b(poster|wall art)\b/i.test(lower)) return 'poster';
  if (/\b(banner|cover)\b/i.test(lower)) return 'banner';
  if (/\b(card|business card|greeting)\b/i.test(lower)) return 'card';
  
  return 'general';
}

/**
 * Generate base image using Google Gemini (Nano Banana quality — FREE)
 * Falls back to backend AI engine if Gemini unavailable
 */
async function generateBaseImage(prompt: string, width = 1024, height = 1024): Promise<string> {
  const enhancedPrompt = enhancePrompt(prompt);
  console.log('[ImageGen] Calling backend — Gemini primary (via backend proxy)');

  try {
    const response = await fetch('/api/v1/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        preferredProviders: ['gemini'],
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Backend failed: ${response.status} ${errorText.slice(0, 100)}`);
    }

    const data = await response.json();

    // Backend returns: { success, provider, model, mediaUrl, imageBase64, fallbackFrom }
    if (data?.success === false) {
      throw new Error(data.error || 'Image generation failed');
    }

    // imageBase64 is always base64 (canvas-safe), mediaUrl may be a URL or base64
    const imageUrl = data.imageBase64 || data.mediaUrl;

    if (imageUrl) {
      console.log('[ImageGen] Got image from provider:', data.provider, data.fallbackFrom ? `(fallback from ${data.fallbackFrom})` : '');
      return imageUrl;
    }

    throw new Error('Backend returned no image');
  } catch (err) {
    console.error('[ImageGen] Generation failed:', err);
    throw err;
  }
}
/**
 * Generate high-quality SVG placeholder when APIs fail
 */
function generateHighQualityPlaceholder(prompt: string, width: number, height: number): string {
  const type = detectImageType(prompt);
  
  const colors: Record<ImageType, [string, string, string]> = {
    logo: ['#1e40af', '#3b82f6', '#60a5fa'],
    flyer: ['#dc2626', '#f59e0b', '#fbbf24'],
    ad: ['#7c3aed', '#a78bfa', '#c4b5fd'],
    letterhead: ['#0f766e', '#14b8a6', '#5eead4'],
    poster: ['#be123c', '#fb7185', '#fda4af'],
    banner: ['#ea580c', '#fb923c', '#fdba74'],
    card: ['#1f2937', '#6b7280', '#9ca3af'],
    general: ['#008751', '#00d37a', '#00ff88'],
  };
  
  const [color1, color2, color3] = colors[type];
  const safePrompt = escapeXml(prompt.slice(0, 60));
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${color2};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color3};stop-opacity:1" />
        </linearGradient>
        <filter id="blur1">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
        </filter>
        <filter id="shadow1">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background gradient -->
      <rect width="${width}" height="${height}" fill="url(#grad1)"/>
      
      <!-- Abstract decorative shapes -->
      <circle cx="${width * 0.15}" cy="${height * 0.25}" r="${Math.min(width, height) * 0.18}" 
        fill="white" opacity="0.15" filter="url(#blur1)"/>
      <circle cx="${width * 0.85}" cy="${height * 0.75}" r="${Math.min(width, height) * 0.15}" 
        fill="white" opacity="0.12" filter="url(#blur1)"/>
      <circle cx="${width * 0.5}" cy="${height * 0.5}" r="${Math.min(width, height) * 0.25}" 
        fill="white" opacity="0.08" filter="url(#blur1)"/>
      
      <!-- Type label -->
      <text x="${width/2}" y="80" 
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        font-size="28" font-weight="700" fill="white" opacity="0.9" 
        text-anchor="middle" letter-spacing="2">
        ${type.toUpperCase()}
      </text>
      
      <!-- Main prompt text -->
      <text x="${width/2}" y="${height/2 - 20}" 
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        font-size="${type === 'logo' ? '56' : '44'}" font-weight="800" 
        fill="white" text-anchor="middle" 
        filter="url(#shadow1)">
        ${safePrompt}
      </text>
      
      <!-- Quality indicator -->
      <text x="${width/2}" y="${height/2 + 40}" 
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        font-size="20" font-weight="600" 
        fill="white" opacity="0.8" text-anchor="middle">
        Professional AI Design
      </text>
      
      <!-- Branding -->
      <text x="${width/2}" y="${height - 50}" 
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        font-size="18" font-weight="500" 
        fill="white" opacity="0.7" text-anchor="middle">
        Powered by 9JAI · Nigerian AI Excellence
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generate image with text overlay using canvas/SVG
 */
async function generateImageWithText(request: ImageRequest): Promise<string> {
  const baseImageUrl = await generateBaseImage(request.prompt, request.width, request.height);
  
  // Create SVG with background image and text overlays
  const width = request.width || 1024;
  const height = request.height || 1024;
  
  const textElements = request.textElements || [];
  const textSVG = textElements.map((element, index) => {
    const size = element.size || 48;
    const color = element.color || '#FFFFFF';
    const font = element.font || 'Arial, sans-serif';
    
    let x = element.x || width / 2;
    let y = element.y || calculateYPosition(element.position, height, index, textElements.length);
    
    return `
      <text 
        x="${x}" 
        y="${y}" 
        font-size="${size}" 
        fill="${color}" 
        font-family="${font}" 
        text-anchor="middle"
        font-weight="bold"
        stroke="#000000"
        stroke-width="2"
        paint-order="stroke"
      >${escapeXml(element.text)}</text>
    `;
  }).join('\n');
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <image href="${baseImageUrl}" width="${width}" height="${height}" />
      ${textSVG}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Calculate Y position for text based on position type
 */
function calculateYPosition(position: string, height: number, index: number, total: number): number {
  switch (position) {
    case 'top':
      return 100 + (index * 80);
    case 'center':
      const centerStart = (height / 2) - ((total * 60) / 2);
      return centerStart + (index * 80);
    case 'bottom':
      return height - 100 - ((total - index - 1) * 80);
    default:
      return height / 2;
  }
}

/**
 * Enhance prompt based on image type for MAXIMUM quality
 */
function enhancePrompt(prompt: string): string {
  const type = detectImageType(prompt);

  // Strip any overlay metadata before sending to image API
  const cleanPrompt = prompt.split(' | overlay_text:')[0].trim();

  // Quality suffix — minimal, natural language (works better with Gemini than SD keywords)
  const qualitySuffix: Record<ImageType, string> = {
    general:    'high quality, detailed, professional',
    flyer:      'professional marketing flyer, vibrant colors, print ready',
    ad:         'professional advertisement, high quality commercial design',
    logo:       'professional logo design, clean, vector style, high contrast',
    letterhead: 'professional letterhead, corporate design, high quality',
    poster:     'professional poster design, vibrant, high quality print',
    banner:     'professional banner design, modern, high quality',
    card:       'professional business card design, elegant, high quality',
  };

  return `${cleanPrompt}, ${qualitySuffix[type]}`;
}

/**
 * Generate fallback SVG when API fails
 */
function generateFallbackSVG(prompt: string, width = 1024, height = 1024): string {
  const safePrompt = escapeXml(prompt.slice(0, 100));
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#008751;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#00d37a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <circle cx="${width/2}" cy="${height/3}" r="${Math.min(width, height)/6}" fill="rgba(255,255,255,0.2)"/>
      <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="32" fill="#ffffff" text-anchor="middle" font-weight="bold">
        ${safePrompt}
      </text>
      <text x="${width/2}" y="${height/2 + 50}" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">
        9JAI Image Generation
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Escape XML special characters
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
 * Extract text elements from prompt
 */
export function extractTextFromPrompt(prompt: string): { cleanPrompt: string; textElements: TextElement[] } {
  const textElements: TextElement[] = [];
  let cleanPrompt = prompt;
  
  // Look for text in quotes
  const quotePattern = /"([^"]+)"|'([^']+)'/g;
  let match;
  
  while ((match = quotePattern.exec(prompt)) !== null) {
    const text = match[1] || match[2];
    textElements.push({
      text,
      position: 'center',
      size: 48,
      color: '#FFFFFF',
    });
    // Remove the quoted text from the prompt
    cleanPrompt = cleanPrompt.replace(match[0], '').trim();
  }
  
  return { cleanPrompt, textElements };
}

/**
 * Parse image generation request from user input
 */
export function parseImageRequest(userInput: string): ImageRequest {
  const { cleanPrompt, textElements } = extractTextFromPrompt(userInput);
  const type = detectImageType(userInput);
  
  // Determine dimensions based on type
  let width = 1024;
  let height = 1024;
  
  switch (type) {
    case 'flyer':
    case 'poster':
      width = 800;
      height = 1200;
      break;
    case 'banner':
      width = 1200;
      height = 400;
      break;
    case 'card':
      width = 1050;
      height = 600;
      break;
    case 'letterhead':
      width = 850;
      height = 1100;
      break;
    case 'logo':
      width = 512;
      height = 512;
      break;
  }
  
  return {
    prompt: cleanPrompt || userInput,
    type,
    width,
    height,
    textElements: textElements.length > 0 ? textElements : undefined,
  };
}

/**
 * Generate image with quota check (USE THIS FROM COMPONENTS)
 * Implements ChatGPT-style per-user rate limiting
 */
export async function generateImageWithQuotaCheck(
  request: ImageRequest,
  userId?: string,
  email?: string
): Promise<ImageResult & { quotaExceeded?: boolean; quotaMessage?: string; remaining?: { daily: number; monthly: number } }> {
  // If user is logged in, check quota
  if (userId && email) {
    const { canGenerateImage, recordImageGeneration } = await import('./imageQuota');
    
    const quotaCheck = await canGenerateImage(userId, email);
    
    if (!quotaCheck.allowed) {
      console.log('[ImageGen] Quota exceeded for user:', userId);
      return {
        success: false,
        imageUrl: generateHighQualityPlaceholder('Daily Limit Reached', 1024, 1024),
        type: request.type || 'general',
        prompt: request.prompt,
        timestamp: Date.now(),
        quotaExceeded: true,
        quotaMessage: quotaCheck.reason || 'Daily limit reached. Try again tomorrow!',
        error: quotaCheck.reason,
      };
    }
    
    console.log('[ImageGen] Quota check passed. Remaining:', quotaCheck.remaining);
    
    // Generate image
    const result = await generateImage(request);
    
    // Record generation if successful
    if (result.success) {
      await recordImageGeneration(userId);
      console.log('[ImageGen] Generation recorded. Remaining:', quotaCheck.remaining);
    }
    
    return { ...result, remaining: quotaCheck.remaining };
  }
  
  // No user logged in - generate without quota (or require login)
  console.log('[ImageGen] No user - generating without quota tracking');
  return generateImage(request);
}
