/**
 * Detect image type and extract parameters from user request
 */

import type { ImageGenerationRequest } from './newImageEngine';

export function detectImageType(userMessage: string): ImageGenerationRequest | null {
  const lower = userMessage.toLowerCase();
  
  // Check if it's an image request
  const isImageRequest = 
    /\b(generate|create|make|design|build)\b.*\b(image|picture|photo|graphic|visual)\b/i.test(userMessage) ||
    /\b(logo|flyer|poster|banner|ad|advertisement|business card|letterhead)\b/i.test(userMessage);
  
  if (!isImageRequest) return null;
  
  const request: ImageGenerationRequest = {
    prompt: '',
    type: 'regular',
  };
  
  // Detect specific types
  if (/\blogo\b/i.test(lower)) {
    request.type = 'logo';
    request.style = 'professional';
    // Extract business name
    const match = userMessage.match(/logo\s+(?:for|of)\s+([^.,!?]+)/i);
    if (match) {
      request.prompt = match[1].trim();
    } else {
      request.prompt = userMessage.replace(/\b(generate|create|make|design|logo|for|of|a|an|the)\b/gi, '').trim();
    }
  }
  else if (/\bflyer\b/i.test(lower)) {
    request.type = 'flyer';
    request.style = 'professional';
    request.prompt = userMessage.replace(/\b(generate|create|make|design|flyer|for|of|a|an|the)\b/gi, '').trim();
    
    // Extract text elements
    const titleMatch = userMessage.match(/title[:\s]+["']([^"']+)["']/i);
    const descMatch = userMessage.match(/(?:description|about)[:\s]+["']([^"']+)["']/i);
    
    if (titleMatch || descMatch) {
      request.textOverlay = {
        title: titleMatch?.[1],
        body: descMatch?.[1],
      };
    }
  }
  else if (/\b(business card|businesscard)\b/i.test(lower)) {
    request.type = 'business-card';
    request.style = 'professional';
    request.prompt = userMessage.replace(/\b(generate|create|make|design|business|card|for|of|a|an|the)\b/gi, '').trim();
    
    // Extract details
    const nameMatch = userMessage.match(/(?:name|for)[:\s]+["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    const titleMatch = userMessage.match(/(?:title|position)[:\s]+["']([^"']+)["']/i);
    const companyMatch = userMessage.match(/(?:company|business)[:\s]+["']([^"']+)["']/i);
    
    if (nameMatch || titleMatch || companyMatch) {
      request.textOverlay = {
        title: nameMatch?.[1],
        subtitle: titleMatch?.[1],
        body: companyMatch?.[1],
      };
    }
  }
  else if (/\bletterhead\b/i.test(lower)) {
    request.type = 'letterhead';
    request.style = 'professional';
    request.prompt = userMessage.replace(/\b(generate|create|make|design|letterhead|for|of|a|an|the)\b/gi, '').trim();
  }
  else if (/\b(ad|advertisement|advert)\b/i.test(lower)) {
    request.type = 'ad';
    request.style = 'artistic';
    request.prompt = userMessage.replace(/\b(generate|create|make|design|ad|advertisement|for|of|a|an|the)\b/gi, '').trim();
    
    // Extract call to action
    const ctaMatch = userMessage.match(/(?:call to action|cta)[:\s]+["']([^"']+)["']/i);
    if (ctaMatch) {
      request.textOverlay = { footer: ctaMatch[1] };
    }
  }
  else if (/\bbanner\b/i.test(lower)) {
    request.type = 'banner';
    request.style = 'professional';
    request.prompt = userMessage.replace(/\b(generate|create|make|design|banner|for|of|a|an|the)\b/gi, '').trim();
  }
  else if (/\bposter\b/i.test(lower)) {
    request.type = 'poster';
    request.style = 'artistic';
    request.prompt = userMessage.replace(/\b(generate|create|make|design|poster|for|of|a|an|the)\b/gi, '').trim();
  }
  else {
    // Regular image
    request.type = 'regular';
    request.prompt = userMessage.replace(/\b(generate|create|make|design|image|picture|photo|of|a|an|the)\b/gi, '').trim();
  }
  
  // Detect style preferences
  if (/\b(realistic|photorealistic|photo)\b/i.test(lower)) {
    request.style = 'realistic';
  } else if (/\b(illustration|illustrated|cartoon)\b/i.test(lower)) {
    request.style = 'illustration';
  } else if (/\b(3d|three dimensional|rendered)\b/i.test(lower)) {
    request.style = '3d';
  } else if (/\b(minimalist|minimal|simple)\b/i.test(lower)) {
    request.style = 'minimalist';
  } else if (/\b(artistic|art|creative)\b/i.test(lower)) {
    request.style = 'artistic';
  }
  
  // Clean up prompt
  request.prompt = request.prompt.trim() || 'modern design';
  
  return request;
}

/**
 * Extract text overlay from user message
 */
export function extractTextOverlay(userMessage: string): ImageGenerationRequest['textOverlay'] | undefined {
  const overlay: any = {};
  
  // Extract title
  const titleMatch = userMessage.match(/title[:\s]+["']([^"']+)["']/i);
  if (titleMatch) overlay.title = titleMatch[1];
  
  // Extract subtitle
  const subtitleMatch = userMessage.match(/subtitle[:\s]+["']([^"']+)["']/i);
  if (subtitleMatch) overlay.subtitle = subtitleMatch[1];
  
  // Extract body
  const bodyMatch = userMessage.match(/(?:body|text|description)[:\s]+["']([^"']+)["']/i);
  if (bodyMatch) overlay.body = bodyMatch[1];
  
  // Extract footer
  const footerMatch = userMessage.match(/footer[:\s]+["']([^"']+)["']/i);
  if (footerMatch) overlay.footer = footerMatch[1];
  
  return Object.keys(overlay).length > 0 ? overlay : undefined;
}
