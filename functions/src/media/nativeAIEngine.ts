/**
 * Native 9JAI AI Engine
 * 
 * This is the CORE image generation engine using self-hosted GPU models.
 * External APIs (OpenRouter, etc.) should ONLY be used as fallbacks.
 * 
 * PRIMARY MODELS (Self-Hosted):
 * - Stable Diffusion XL Turbo (fast, good quality)
 * - FLUX Schnell (excellent quality, medium speed)
 * - FLUX Dev (best quality, slower)
 * - ControlNet (precise composition)
 * 
 * ARCHITECTURE:
 * 1. Classify image type (photorealistic, 3D, logo, etc.)
 * 2. Select appropriate model
 * 3. Generate using native GPU
 * 4. Validate output is REAL AI generation
 * 5. Return with honest metadata
 */

import fetch from 'node-fetch';

// GPU endpoint read from environment at runtime — set via Firebase secret or .env
// firebase functions:secrets:set COMFYUI_ENDPOINT
// No defineSecret here — avoids blocking deploy when secret doesn't exist yet

/**
 * Image type classification
 */
export type ImageType = 
  | 'photorealistic'   // Photos, portraits, landscapes
  | '3d-render'        // 3D rendered objects, characters
  | 'logo'             // Brand logos, emblems, icons
  | 'illustration'     // Cartoons, drawings, artwork
  | 'scientific'       // Diagrams, charts, medical visualizations
  | 'typography'       // Text-based designs
  | 'hybrid';          // AI background + typography overlay (flyers, posters)

/**
 * Model configuration
 */
export interface ModelConfig {
  id: string;
  name: string;
  type: 'text-to-image' | 'image-to-image' | 'inpainting';
  capabilities: ImageType[];
  quality: number; // 1-10
  speed: 'fast' | 'medium' | 'slow';
  vramRequired: number; // GB
  checkpointFile: string; // Filename in ComfyUI models folder
}

/**
 * Available models (configured for your GPU setup)
 */
export const NATIVE_MODELS: ModelConfig[] = [
  {
    id: 'sdxl-turbo',
    name: 'Stable Diffusion XL Turbo',
    type: 'text-to-image',
    capabilities: ['photorealistic', 'illustration', 'hybrid'],
    quality: 8,
    speed: 'fast',
    vramRequired: 8,
    checkpointFile: 'sd_xl_turbo_1.0_fp16.safetensors',
  },
  {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    type: 'text-to-image',
    capabilities: ['photorealistic', '3d-render', 'illustration'],
    quality: 9,
    speed: 'fast',
    vramRequired: 12,
    checkpointFile: 'flux1-schnell.safetensors',
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    type: 'text-to-image',
    capabilities: ['photorealistic', '3d-render', 'logo', 'scientific'],
    quality: 10,
    speed: 'medium',
    vramRequired: 16,
    checkpointFile: 'flux1-dev.safetensors',
  },
];

/**
 * Generation request
 */
export interface NativeGenerationRequest {
  prompt: string;
  imageType?: ImageType;
  width?: number;
  height?: number;
  model?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

/**
 * Generation result
 */
export interface NativeGenerationResult {
  imageBase64: string;
  model: string;
  inferenceTimeMs: number;
  source: 'native-gpu' | 'native-cpu' | 'fallback';
  metadata: {
    imageType: ImageType;
    seed: number;
    steps: number;
    cfg_scale: number;
    sampler: string;
    resolution: string;
  };
}

/**
 * Classify image type from prompt keywords
 */
export function classifyImageType(prompt: string): ImageType {
  const lower = prompt.toLowerCase();
  
  // Logo detection
  if (/\b(logo|brand|emblem|icon|symbol|mark)\b/.test(lower)) {
    return 'logo';
  }
  
  // 3D render detection
  if (/\b(3d|render|model|blender|maya|cinema 4d|octane)\b/.test(lower)) {
    return '3d-render';
  }
  
  // Scientific detection
  if (/\b(scientific|diagram|chart|graph|medical|anatomical|technical|schematic)\b/.test(lower)) {
    return 'scientific';
  }
  
  // Illustration detection
  if (/\b(cartoon|illustration|drawing|anime|manga|comic|sketch)\b/.test(lower)) {
    return 'illustration';
  }
  
  // Hybrid design detection (flyers, posters, ads with text)
  if (/\b(flyer|poster|business card|ad|advertisement|banner|letterhead)\b/.test(lower)) {
    return 'hybrid';
  }
  
  // Typography detection
  if (/\b(typography|text design|font|lettering)\b/.test(lower)) {
    return 'typography';
  }
  
  // Default to photorealistic
  return 'photorealistic';
}

/**
 * Select best model for image type
 */
export function selectModelForType(imageType: ImageType): ModelConfig {
  // Try to find a model that supports this image type
  const suitableModels = NATIVE_MODELS
    .filter(m => m.capabilities.includes(imageType))
    .sort((a, b) => b.quality - a.quality); // Sort by quality (highest first)
  
  if (suitableModels.length > 0) {
    return suitableModels[0];
  }
  
  // Fallback to best general model
  return NATIVE_MODELS.find(m => m.id === 'flux-dev') || NATIVE_MODELS[0];
}

/**
 * Enhance prompt with quality modifiers based on image type
 */
export function enhancePromptForQuality(prompt: string, imageType: ImageType): string {
  const qualityModifiers: Record<ImageType, string> = {
    'photorealistic': 
      'masterpiece, best quality, ultra detailed, 8k uhd, photorealistic, professional photography, ' +
      'dramatic lighting, vivid colors, sharp focus, high resolution',
    
    '3d-render': 
      'professional 3D render, octane render, unreal engine 5, raytracing, physically based rendering, ' +
      'subsurface scattering, volumetric lighting, studio lighting, 8k, ultra detailed',
    
    'logo': 
      'minimalist logo design, vector graphic style, clean lines, iconic, professional branding, ' +
      'high contrast, simple, memorable, timeless design, perfect symmetry',
    
    'illustration': 
      'beautiful illustration, detailed artwork, vibrant colors, professional digital art, ' +
      'masterpiece, trending on artstation, award winning, highly detailed',
    
    'scientific': 
      'scientific illustration, technical diagram, accurate, detailed, professional medical visualization, ' +
      'educational quality, precise, clear labeling, high resolution',
    
    'typography': 
      'clean typography, modern font design, professional graphic design, elegant lettering, ' +
      'minimalist, readable, contemporary',
    
    'hybrid': 
      'professional graphic design, commercial quality, print ready, high resolution, ' +
      'eye-catching, modern layout, vibrant colors, marketing material',
  };
  
  const negativePrompts = 
    'low quality, blurry, distorted, watermark, text, signature, username, ' +
    'out of focus, grainy, pixelated, jpeg artifacts, worst quality';
  
  return `${prompt}, ${qualityModifiers[imageType]}. Negative: ${negativePrompts}`;
}

/**
 * Build ComfyUI workflow JSON
 * 
 * ComfyUI uses a node-based workflow system where each node has:
 * - class_type: The node type (CheckpointLoader, KSampler, etc.)
 * - inputs: Parameters and connections to other nodes
 */
function buildComfyUIWorkflow(params: {
  checkpoint: string;
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  seed: number;
  sampler: string;
}): any {
  return {
    // Node 1: Load checkpoint (model)
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": params.checkpoint
      }
    },
    
    // Node 2: Encode positive prompt
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": params.prompt,
        "clip": ["1", 1] // Connect to checkpoint's CLIP output
      }
    },
    
    // Node 3: Encode negative prompt
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": params.negativePrompt,
        "clip": ["1", 1]
      }
    },
    
    // Node 4: Create empty latent image (noise)
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": params.width,
        "height": params.height,
        "batch_size": 1
      }
    },
    
    // Node 5: KSampler (the actual diffusion process)
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "seed": params.seed,
        "steps": params.steps,
        "cfg": params.cfg_scale,
        "sampler_name": params.sampler,
        "scheduler": "normal",
        "denoise": 1.0,
        "model": ["1", 0], // Connect to checkpoint's model output
        "positive": ["2", 0], // Connect to positive prompt
        "negative": ["3", 0], // Connect to negative prompt
        "latent_image": ["4", 0] // Connect to empty latent
      }
    },
    
    // Node 6: Decode latent to image
    "6": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["5", 0], // Connect to KSampler output
        "vae": ["1", 2] // Connect to checkpoint's VAE output
      }
    },
    
    // Node 7: Save image
    "7": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": "9jai",
        "images": ["6", 0] // Connect to VAE decoder output
      }
    }
  };
}

/**
 * Submit workflow to ComfyUI and get prompt ID
 */
async function submitWorkflow(workflow: any, endpoint: string, apiKey?: string): Promise<string> {
  const response = await fetch(`${endpoint}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    },
    body: JSON.stringify({ prompt: workflow }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ComfyUI submission failed: ${response.status} ${errorText}`);
  }
  
  const data = await response.json() as any;
  
  if (!data.prompt_id) {
    throw new Error('ComfyUI did not return prompt_id');
  }
  
  return data.prompt_id;
}

/**
 * Poll ComfyUI for completion and retrieve generated image
 */
async function pollForCompletion(
  promptId: string, 
  endpoint: string,
  maxAttempts = 120, // 2 minutes with 1s polling
  pollIntervalMs = 1000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    
    try {
      // Check history endpoint
      const response = await fetch(`${endpoint}/history/${promptId}`);
      
      if (!response.ok) {
        console.warn(`[NativeAI] History check failed: ${response.status}`);
        continue;
      }
      
      const data = await response.json() as any;
      const history = data[promptId];
      
      if (!history) {
        // Not ready yet
        continue;
      }
      
      // Check if completed
      if (history.status?.completed === true || history.outputs) {
        // Find output image node
        const outputs = history.outputs;
        const imageNode = Object.values(outputs || {}).find((node: any) => node.images);
        
        if (imageNode && (imageNode as any).images && (imageNode as any).images[0]) {
          const imageInfo = (imageNode as any).images[0];
          const imageFilename = imageInfo.filename;
          
          // Fetch the actual image
          const imageResponse = await fetch(`${endpoint}/view?filename=${imageFilename}`);
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
          }
          
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          
          // Determine image format
          const mimeType = imageInfo.type === 'output' ? 'image/png' : 'image/png';
          
          return `data:${mimeType};base64,${base64}`;
        }
      }
      
      // Check if failed
      if (history.status?.status_str === 'error') {
        const errorMessage = history.status?.messages?.join(', ') || 'Unknown error';
        throw new Error(`ComfyUI generation failed: ${errorMessage}`);
      }
      
    } catch (err: any) {
      if (attempt === maxAttempts - 1) {
        throw err;
      }
      console.warn(`[NativeAI] Poll attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  
  throw new Error(`Image generation timed out after ${maxAttempts} attempts`);
}

/**
 * MAIN FUNCTION: Generate image using native GPU infrastructure
 * 
 * This is the PRIMARY image generation method.
 * It uses self-hosted models running on GPU.
 */
export async function generateImageNative(
  request: NativeGenerationRequest
): Promise<NativeGenerationResult> {
  const startTime = Date.now();
  
  // Get endpoints from secrets
  const endpoint = process.env.COMFYUI_ENDPOINT || 'http://localhost:7860';
  const apiKey = process.env.GPU_API_KEY;
  
  console.log('[NativeAI] Starting native generation');
  console.log('[NativeAI] Endpoint:', endpoint);
  console.log('[NativeAI] Prompt:', request.prompt.slice(0, 100));
  
  // Step 1: Classify image type
  const imageType = request.imageType || classifyImageType(request.prompt);
  console.log('[NativeAI] Image type:', imageType);
  
  // Step 2: Select appropriate model
  const modelConfig = request.model 
    ? NATIVE_MODELS.find(m => m.id === request.model) || selectModelForType(imageType)
    : selectModelForType(imageType);
  
  console.log('[NativeAI] Selected model:', modelConfig.name);
  
  // Step 3: Enhance prompt for quality
  const enhancedPrompt = enhancePromptForQuality(request.prompt, imageType);
  console.log('[NativeAI] Enhanced prompt:', enhancedPrompt.slice(0, 150));
  
  // Step 4: Prepare generation parameters
  const width = request.width || 1024;
  const height = request.height || 1024;
  const steps = request.steps || (modelConfig.speed === 'fast' ? 20 : 30);
  const cfg_scale = request.cfg_scale || 7.5;
  const seed = request.seed || Math.floor(Math.random() * 1000000);
  const sampler = 'euler_ancestral'; // Good default sampler
  
  // Extract negative prompt from enhanced prompt
  const [positivePrompt, negativePrompt] = enhancedPrompt.split('Negative:').map(s => s.trim());
  
  // Step 5: Build ComfyUI workflow
  const workflow = buildComfyUIWorkflow({
    checkpoint: modelConfig.checkpointFile,
    prompt: positivePrompt,
    negativePrompt: negativePrompt || 'low quality, blurry',
    width,
    height,
    steps,
    cfg_scale,
    seed,
    sampler,
  });
  
  console.log('[NativeAI] Workflow built, submitting to ComfyUI...');
  
  // Step 6: Submit workflow
  // Use secure HTTP helper to submit the workflow (keeps auth header handling centralized)
  const { submitWorkflowHttp } = await import('./comfyHttpFixed');
  const promptId = await submitWorkflowHttp(workflow, endpoint, apiKey);
  console.log('[NativeAI] Submitted with prompt_id:', promptId);
  
  // Step 7: Poll for completion
  console.log('[NativeAI] Polling for completion...');
  const imageBase64 = await pollForCompletion(promptId, endpoint);
  
  const inferenceTimeMs = Date.now() - startTime;
  console.log(`[NativeAI] ✓ Generation complete in ${inferenceTimeMs}ms`);
  
  // Step 8: Validate the image is real (not placeholder)
  const isValid = validateGeneratedImage(imageBase64);
  if (!isValid) {
    throw new Error('Generated image failed validation (may be placeholder)');
  }
  
  return {
    imageBase64,
    model: modelConfig.name,
    inferenceTimeMs,
    source: 'native-gpu',
    metadata: {
      imageType,
      seed,
      steps,
      cfg_scale,
      sampler,
      resolution: `${width}x${height}`,
    },
  };
}

/**
 * Validate that image is actually AI-generated (not placeholder)
 */
function validateGeneratedImage(imageBase64: string): boolean {
  // Check 1: Not an SVG placeholder
  if (imageBase64.startsWith('data:image/svg+xml')) {
    console.error('[NativeAI] Validation FAIL: Image is SVG placeholder');
    return false;
  }
  
  // Check 2: Reasonable file size (AI images are typically 200KB - 3MB)
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  const sizeBytes = (base64Data.length * 0.75); // base64 to bytes conversion
  const sizeKB = sizeBytes / 1024;
  
  if (sizeKB < 50) {
    console.error(`[NativeAI] Validation FAIL: Image too small (${sizeKB.toFixed(1)}KB)`);
    return false;
  }
  
  if (sizeKB > 10000) {
    console.error(`[NativeAI] Validation FAIL: Image too large (${sizeKB.toFixed(1)}KB)`);
    return false;
  }
  
  // Check 3: Valid image format
  if (!imageBase64.startsWith('data:image/')) {
    console.error('[NativeAI] Validation FAIL: Invalid image format');
    return false;
  }
  
  console.log(`[NativeAI] Validation PASS: Image appears valid (${sizeKB.toFixed(1)}KB)`);
  return true;
}

/**
 * Check if native GPU infrastructure is available
 */
export async function checkNativeAIAvailable(): Promise<boolean> {
  const endpoint = process.env.COMFYUI_ENDPOINT || 'http://localhost:7860';
  
  try {
    const response = await fetch(`${endpoint}/system_stats`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    if (response.ok) {
      console.log('[NativeAI] GPU infrastructure is available');
      return true;
    }
    
    console.warn('[NativeAI] GPU infrastructure responded with error:', response.status);
    return false;
  } catch (err: any) {
    console.warn('[NativeAI] GPU infrastructure not available:', err.message);
    return false;
  }
}

/**
 * Get GPU status and model info
 */
export async function getNativeAIStatus(): Promise<{
  available: boolean;
  models: string[];
  vramUsed?: number;
  vramTotal?: number;
}> {
  const endpoint = process.env.COMFYUI_ENDPOINT || 'http://localhost:7860';
  
  try {
    const response = await fetch(`${endpoint}/system_stats`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) {
      return { available: false, models: [] };
    }
    
    const data = await response.json() as any;
    
    return {
      available: true,
      models: NATIVE_MODELS.map(m => m.name),
      vramUsed: data.vram?.used,
      vramTotal: data.vram?.total,
    };
  } catch {
    return { available: false, models: [] };
  }
}
