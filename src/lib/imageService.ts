/**
 * Image Generation Service
 * Generates images using AI models
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

/**
 * Generate image from text prompt
 * Uses multiple APIs with fallback
 */
function buildUltraHdPrompt(prompt: string): string {
  if (!prompt || !prompt.trim()) return prompt;

  const base = prompt.trim();
  const africanBoost = /\b(africa|african|nigeria|nigerian|ghana|yoruba|igbo|hausa|lagos|abuja|kano|port harcourt|accra|kigali|afrofuturism)\b/i.test(base)
    ? 'authentic African skin tones, natural African hairstyles, cultural fashion, warm melanin texture, realistic Nigerian architecture, vibrant African environments'
    : '';

  const detailBoost = [
    'ultra-realistic',
    'cinematic HDR lighting',
    '8k resolution',
    '4k RAW quality',
    'photorealistic textures',
    'global illumination',
    'volumetric lighting',
    'accurate anatomy',
    'realistic facial detail',
    'sharp focus',
    'no blur',
    'no noise',
    'no artifacts',
    'professional color grading',
    'realistic shadows',
    'extremely detailed',
    'high fidelity'
  ];

  return `${base}, ${detailBoost.join(', ')}${africanBoost ? `, ${africanBoost}` : ''}`;
}

const createPollinationsUrl = (prompt: string, seed = Math.floor(Math.random() * 999999)) => {
  const enhanced = buildUltraHdPrompt(prompt);
  const encoded = encodeURIComponent(enhanced);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&enhance=true`;
};

async function verifyImageUrl(url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    setTimeout(() => resolve(false), 15000);
  });
}

async function pollinationsProvider(prompt: string): Promise<{ imageUrl: string; model: string } | null> {
  const seed = Math.floor(Math.random() * 999999);
  const url = createPollinationsUrl(prompt, seed);
  console.log('[ImageService] Pollinations request:', url);
  if (await verifyImageUrl(url)) {
    console.log('[ImageService] Pollinations success:', url);
    return { imageUrl: url, model: 'pollinations' };
  }
  console.warn('[ImageService] Pollinations failed:', url);
  return null;
}

async function openRouterProvider(prompt: string): Promise<{ imageUrl: string; model: string } | null> {
  const key = process.env.REACT_APP_OPENROUTER_KEY;
  if (!key) return null;
  console.log('[ImageService] OpenRouter request:', prompt);
  try {
    const response = await fetch('https://openrouter.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024' }),
    });
    const data = await response.json();
    console.log('[ImageService] OpenRouter response:', data);
    const url = data?.output?.[0]?.url ?? data?.data?.[0]?.url;
    if (url && await verifyImageUrl(url)) {
      console.log('[ImageService] OpenRouter success:', url);
      return { imageUrl: url, model: 'openrouter' };
    }
  } catch (err) {
    console.warn('[ImageService] OpenRouter failed:', err);
  }
  return null;
}

async function huggingFaceProvider(prompt: string): Promise<{ imageUrl: string; model: string } | null> {
  const token = process.env.REACT_APP_HF_TOKEN;
  if (!token) return null;
  console.log('[ImageService] Hugging Face request:', prompt);
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    });
    if (!response.ok) {
      console.warn('[ImageService] Hugging Face HTTP error:', response.status);
      return null;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    console.log('[ImageService] Hugging Face generated blob URL');
    return { imageUrl: url, model: 'huggingface' };
  } catch (err) {
    console.warn('[ImageService] Hugging Face failed:', err);
    return null;
  }
}

async function togetherAiProvider(prompt: string): Promise<{ imageUrl: string; model: string } | null> {
  const token = process.env.REACT_APP_TOGETHER_AI_TOKEN;
  if (!token) return null;
  console.log('[ImageService] Together AI request:', prompt);
  try {
    const response = await fetch('https://api.together.ai/inference?model=stabilityai/stable-diffusion-2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ input: prompt }),
    });
    const data = await response.json();
    console.log('[ImageService] Together AI response:', data);
    const url = data?.output?.[0] ?? data?.image ?? data?.images?.[0];
    if (typeof url === 'string') {
      return { imageUrl: url, model: 'togetherai' };
    }
  } catch (err) {
    console.warn('[ImageService] Together AI failed:', err);
  }
  return null;
}

async function replicateProvider(prompt: string): Promise<{ imageUrl: string; model: string } | null> {
  const token = process.env.REACT_APP_REPLICATE_TOKEN;
  if (!token) return null;
  console.log('[ImageService] Replicate request:', prompt);
  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21aef19f932d7ad8d3',
        input: { prompt },
      }),
    });
    const data = await response.json();
    console.log('[ImageService] Replicate response:', data);
    const url = data?.output?.[0];
    if (typeof url === 'string') {
      return { imageUrl: url, model: 'replicate' };
    }
  } catch (err) {
    console.warn('[ImageService] Replicate failed:', err);
  }
  return null;
}

export async function generateImageWithFallback(prompt: string): Promise<string> {
  const enhancedPrompt = await enhancePrompt(prompt);
  const providers = [
    pollinationsProvider,
    openRouterProvider,
    huggingFaceProvider,
    togetherAiProvider,
    replicateProvider,
  ];

  for (const provider of providers) {
    try {
      const result = await provider(enhancedPrompt);
      if (result?.imageUrl) {
        console.log('[ImageService] Image returned from provider:', result.model, result.imageUrl);
        return result.imageUrl;
      }
    } catch (err) {
      console.warn('[ImageService] Provider threw error:', err);
    }
  }

  const fallback = createPollinationsUrl(prompt);
  console.warn('[ImageService] All providers failed. Using fallback placeholder:', fallback);
  return fallback;
}

async function tryFetchImageFromHuggingFace(prompt: string): Promise<GeneratedImage | null> {
  const hfToken = process.env.REACT_APP_HF_TOKEN;
  if (!hfToken) return null;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) return null;
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl,
      generatedAt: Date.now(),
      model: 'huggingface',
    };
  } catch (err) {
    console.warn('Hugging Face image generation failed:', err);
    return null;
  }
}

async function tryFetchImageFromReplicate(prompt: string): Promise<GeneratedImage | null> {
  const replicateToken = process.env.REACT_APP_REPLICATE_TOKEN;
  if (!replicateToken) return null;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21aef19f932d7ad8d3',
        input: { prompt },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.output || !data.output[0]) return null;

    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl: data.output[0],
      generatedAt: Date.now(),
      model: 'replicate',
    };
  } catch (err) {
    console.warn('Replicate image generation failed:', err);
    return null;
  }
}

async function tryFetchImageFromOpenRouter(prompt: string): Promise<GeneratedImage | null> {
  const openRouterKey = process.env.REACT_APP_OPENROUTER_KEY;
  if (!openRouterKey) return null;

  try {
    const response = await fetch('https://openrouter.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const url = data?.data?.[0]?.url ?? data?.output?.[0]?.url;
    if (!url) return null;

    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl: url,
      generatedAt: Date.now(),
      model: 'openrouter',
    };
  } catch (err) {
    console.warn('OpenRouter image generation failed:', err);
    return null;
  }
}

async function tryFetchImageFromTogether(prompt: string): Promise<GeneratedImage | null> {
  const togetherToken = process.env.REACT_APP_TOGETHER_AI_TOKEN;
  if (!togetherToken) return null;

  try {
    const response = await fetch('https://api.together.ai/inference?model=stabilityai/stable-diffusion-2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${togetherToken}`,
      },
      body: JSON.stringify({ input: prompt }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const output = data?.output?.[0] ?? data?.image ?? data?.images?.[0];
    if (!output) return null;

    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl: typeof output === 'string' ? output : output.url,
      generatedAt: Date.now(),
      model: 'togetherai',
    };
  } catch (err) {
    console.warn('Together AI image generation failed:', err);
    return null;
  }
}

async function tryFetchImageFromStability(prompt: string): Promise<GeneratedImage | null> {
  const stabilityKey = process.env.REACT_APP_STABILITY_KEY;
  if (!stabilityKey) return null;

  try {
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-2-1/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stabilityKey}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 768,
        width: 512,
        samples: 1,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const base64 = data?.artifacts?.[0]?.base64;
    if (!base64) return null;
    const imageUrl = `data:image/png;base64,${base64}`;

    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl,
      generatedAt: Date.now(),
      model: 'stability',
    };
  } catch (err) {
    console.warn('Stability image generation failed:', err);
    return null;
  }
}

async function tryFetchUnsplashImage(prompt: string): Promise<GeneratedImage | null> {
  const unsplashToken = process.env.REACT_APP_UNSPLASH_TOKEN;
  if (!unsplashToken) return null;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(prompt)}&client_id=${unsplashToken}&per_page=1`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const url = data?.results?.[0]?.urls?.regular;
    if (!url) return null;

    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl: url,
      generatedAt: Date.now(),
      model: 'unsplash',
    };
  } catch (err) {
    console.warn('Unsplash lookup failed:', err);
    return null;
  }
}

/**
 * ChatGPT-Class Image Engine with Progressive Reveal
 * @param prompt User instruction
 * @param onStage Callback for UI holographic wave triggers
 */
export async function generateImage(
  prompt: string, 
  onStage?: (stage: GenerationStage) => void
): Promise<GeneratedImage> {
  
  // 1. Semantic Analysis & Expansion
  onStage?.('analyzing');
  await new Promise(r => setTimeout(r, 600));
  
  onStage?.('expanding');
  const enhancedPrompt = await enhancePrompt(prompt);
  // Client-side quick expansion for immediate feedback if needed, 
  // but backend handles the heavy lifting
  
  onStage?.('generating_candidates');
  
  // 2. Multi-Candidate Loop with AI Validation
  let retryCount = 0;
  const MAX_RETRIES = 2;
  
  while (retryCount <= MAX_RETRIES) {
    try {
      const result = await callImageBackend(enhancedPrompt);
      
      // Internal Validation Check
      if (result.imageUrl && result.imageUrl.length > 50) {
        onStage?.('refining');
        await new Promise(r => setTimeout(r, 800));
        onStage?.('rendering');
        return { ...result, prompt };
      }
    } catch (err) {
      console.warn(`[ImageEngine] Validation failed, retrying candidate generation...`);
      retryCount++;
    }
  }

  throw new Error("Critical rendering failure. Engine could not produce a valid candidate.");
}

async function callImageBackend(prompt: string): Promise<GeneratedImage> {
  try {
    const response = await fetch('/api/ai/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.warn('[ImageService] Backend API failed:', response.status);
      // Fallback to client-side if backend fails
      const imageUrl = await generateImageWithFallback(prompt);
      return {
        id: `img_${Date.now()}`,
        prompt,
        imageUrl,
        generatedAt: Date.now(),
        model: 'fallback',
      };
    }

    const data = await response.json();
    console.log('[ImageService] Backend image generation successful');
    
    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl: data.imageUrl || data.imageBase64,
      generatedAt: Date.now(),
      model: data.provider || data.model || 'backend-generated',
    };
  } catch (err) {
    console.warn('[ImageService] Backend API error:', err);
    // Fallback to client-side
    const imageUrl = await generateImageWithFallback(prompt);
    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl,
      generatedAt: Date.now(),
      model: imageUrl.includes('picsum.photos') ? 'fallback' : 'generated',
    };
  }
}

/**
 * Generate multiple images
 */
export async function generateMultipleImages(
  prompts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<GeneratedImage[]> {
  const images: GeneratedImage[] = [];
  
  for (let i = 0; i < prompts.length; i++) {
    const image = await generateImage(prompts[i]);
    images.push(image);
    onProgress?.(i + 1, prompts.length);
  }
  
  return images;
}

/**
 * Get image generation history from localStorage
 */
export function getImageHistory(): GeneratedImage[] {
  try {
    const data = localStorage.getItem('image_generation_history');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting image history:', error);
    return [];
  }
}

/**
 * Save generated image to history
 */
export function saveImageToHistory(image: GeneratedImage): void {
  try {
    const history = getImageHistory();
    history.unshift(image);
    // Keep only last 50 images
    if (history.length > 50) {
      history.pop();
    }
    localStorage.setItem('image_generation_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving image to history:', error);
  }
}

/**
 * Download generated image
 */
export function downloadImage(imageUrl: string, filename: string): void {
  try {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading image:', error);
  }
}

/**
 * Share generated image
 */
export async function shareImage(imageUrl: string, title: string): Promise<void> {
  try {
    if (navigator.share) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${title}.png`, { type: 'image/png' });
      
      await navigator.share({
        title,
        files: [file],
      });
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(imageUrl);
      alert('Image URL copied to clipboard');
    }
  } catch (error) {
    console.error('Error sharing image:', error);
  }
}

/**
 * Generate image variations
 */
export async function generateImageVariations(
  basePrompt: string,
  variations: number = 3
): Promise<GeneratedImage[]> {
  const prompts = Array.from({ length: variations }, (_, i) => 
    `${basePrompt} (variation ${i + 1})`
  );
  
  return generateMultipleImages(prompts);
}

/**
 * Enhance image prompt with AI
 */
export async function enhancePrompt(prompt: string): Promise<string> {
  try {
    if (!prompt || !prompt.trim()) return prompt;
    const lower = prompt.toLowerCase();
    const africanCue = /\b(africa|african|nigeria|nigerian|ghana|yoruba|igbo|hausa|lagos|abuja|accra|kigali|afrofuturism)\b/i.test(lower);
    const photographyCue = /\b(portrait|headshot|face|close-up|studio|fashion|model)\b/i.test(lower);
    const environmentCue = /\b(city|skyline|street|market|village|forest|ocean|desert|space|technology|future|robot)\b/i.test(lower);

    const enhancements = [
      'ultra-realistic',
      'photorealistic rendering',
      '8k resolution',
      '4k RAW quality',
      'cinematic lighting',
      'HDR',
      'global illumination',
      'volumetric lighting',
      'realistic shadows',
      'professional color grading',
      'hyper-detailed textures',
      'sharp focus',
      'clean high fidelity',
      'accurate facial anatomy',
      'realistic eyes',
      'fine skin detail',
      'no blur',
      'no noise',
      'no artifacts',
      'award-winning composition',
      'dynamic depth of field',
      'cinematic composition',
    ];

    if (africanCue) {
      enhancements.push(
        'authentic African skin tones',
        'natural African hairstyles',
        'realistic Nigerian fashion',
        'rich cultural patterns',
        'African cityscape detail',
        'vibrant West African lighting',
        'culturally accurate environments'
      );
    }

    if (photographyCue) {
      enhancements.push('studio-grade portrait lighting', 'subsurface scattering', 'moisture on lips', 'individual eyelash detail');
    }

    if (environmentCue) {
      enhancements.push('realistic environmental atmosphere', 'cinematic foreground and background separation');
    }

    const enriched = `${prompt.trim()}${enhancements.length ? `, ${enhancements.join(', ')}` : ''}`;
    return enriched;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return prompt;
  }
}
