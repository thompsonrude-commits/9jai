# 9JAI Image Generation System - Complete Architectural Rebuild

## CURRENT STATE ANALYSIS

### ❌ What's Wrong
1. **NO REAL AI GENERATION**: System returns SVG placeholders or stock images, not AI-generated content
2. **External APIs as Primary**: OpenRouter DALL-E 3 ($0.04/image) is the main provider, not a fallback
3. **No Self-Hosted Models**: No Stable Diffusion, FLUX, or other generative models running locally
4. **No GPU Infrastructure**: Cannot run inference without dedicated GPU servers
5. **No Image Classification**: Cannot detect image type (photorealistic, 3D, logo, scientific, etc.)
6. **No Hybrid Pipeline**: Cannot combine AI artwork with typography for designs

### ⚠️ Critical Issues Confirmed by User
- Generated images are actually **retrieved stock photos** or **SVG placeholders**
- User physically tested and confirmed images are NOT AI-generated
- Current implementation is fundamentally dishonest about capabilities
- OpenRouter DALL-E 3 works but costs money ($0.04/image = $1,200/month for 100 users @ 10 images/day)

---

## REQUIRED ARCHITECTURE: NATIVE 9JAI AI INFRASTRUCTURE

### Core Principle
> **External APIs must be OPTIONAL adapters, NOT the core engine.**
> **Self-hosted models must be PRIMARY, with external APIs as fallbacks only.**

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REQUEST                                 │
│  "Generate logo for Nigerian restaurant"                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              IMAGE TYPE CLASSIFIER                               │
│  → Photorealistic | 3D Render | Logo | Scientific               │
│  → Illustration | Typography | Hybrid | Video                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴────────┐
                    ↓                ↓
    ┌───────────────────────┐  ┌──────────────────────┐
    │  NATIVE AI ENGINE     │  │  HYBRID DESIGN       │
    │  (PRIMARY)            │  │  PIPELINE            │
    │                       │  │  (For logos, flyers) │
    │  - Stable Diffusion   │  │                      │
    │  - FLUX               │  │  1. AI Background    │
    │  - ControlNet         │  │  2. Vector Typography│
    │  - Local GPU          │  │  3. Composition      │
    └───────────────────────┘  └──────────────────────┘
                ↓                       ↓
    ┌───────────────────────────────────────────┐
    │     QUALITY VALIDATION                     │
    │  - Verify image is generated (not stock)  │
    │  - Check resolution & format               │
    │  - Validate against request type           │
    └───────────────────────────────────────────┘
                            ↓
                    SUCCESS? ──No──→ FALLBACK CHAIN
                        │                   ↓
                       Yes          ┌──────────────────┐
                        ↓           │ 1. Alternative   │
                 ┌──────────┐      │    Model         │
                 │ METADATA │      │ 2. OpenRouter    │
                 │ - Type   │      │    DALL-E 3      │
                 │ - Model  │      │ 3. Error+SVG     │
                 │ - Source │      └──────────────────┘
                 └──────────┘
```

---

## IMPLEMENTATION PHASES

### PHASE 1: GPU Infrastructure Setup (Week 1)

#### Option A: Cloud GPU (Recommended for MVP)
```bash
# RunPod, Vast.ai, or Lambda Labs
# Cost: ~$0.30-0.50/hour for RTX 3090/4090
# Setup: Docker container with model preloaded

docker pull nvidia/cuda:12.1.0-base-ubuntu22.04
docker run --gpus all -p 7860:7860 \
  -v /models:/models \
  stabilityai/stable-diffusion-webui
```

**Services to Consider:**
- **RunPod**: On-demand GPU pods, ~$0.30/hr for RTX 3090
- **Vast.ai**: Marketplace for cheap GPUs, ~$0.20/hr
- **Lambda Labs**: Dedicated instances, better for production
- **Google Cloud GPU**: A100/T4 instances, expensive but reliable

#### Option B: Self-Hosted GPU Server
```bash
# Hardware Requirements:
# - NVIDIA GPU: RTX 3090/4090 (24GB VRAM)
# - RAM: 32GB minimum
# - Storage: 500GB SSD for models
# - Network: 100Mbps+ upload

# Software Stack:
# - Ubuntu 22.04 LTS
# - CUDA 12.1
# - PyTorch 2.0+
# - ComfyUI or Automatic1111 WebUI
```

#### Cost Analysis
| Solution | Setup Cost | Monthly Cost (24/7) | Monthly Cost (On-Demand) |
|----------|------------|---------------------|--------------------------|
| RunPod GPU Pod | $0 | ~$220 | ~$50 (10hr/day) |
| Vast.ai | $0 | ~$150 | ~$35 (10hr/day) |
| Lambda Labs | $0 | ~$400 | N/A |
| Self-Hosted RTX 4090 | $2,000 | ~$30 (electricity) | ~$30 |
| OpenRouter DALL-E 3 | $0 | $12,000 (100 users) | $12,000 |

**Recommendation**: Start with **RunPod on-demand** for testing, then move to **self-hosted RTX 4090** for production.

---

### PHASE 2: Model Selection & Deployment (Week 1-2)

#### Primary Models to Deploy

```typescript
// Model Registry Configuration
interface ModelConfig {
  id: string;
  name: string;
  type: 'text-to-image' | 'image-to-image' | 'inpainting' | 'upscale';
  provider: 'local' | 'openrouter' | 'replicate';
  capabilities: ImageType[];
  quality: 1-10;
  speed: 'fast' | 'medium' | 'slow';
  vramRequired: number; // GB
  costPerImage?: number; // USD
}

const NATIVE_MODELS: ModelConfig[] = [
  {
    id: 'sdxl-turbo',
    name: 'Stable Diffusion XL Turbo',
    type: 'text-to-image',
    provider: 'local',
    capabilities: ['photorealistic', 'illustration', 'general'],
    quality: 8,
    speed: 'fast',
    vramRequired: 8,
    costPerImage: 0, // FREE (self-hosted)
  },
  {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    type: 'text-to-image',
    provider: 'local',
    capabilities: ['photorealistic', '3d', 'artistic'],
    quality: 9,
    speed: 'fast',
    vramRequired: 12,
    costPerImage: 0, // FREE (self-hosted)
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    type: 'text-to-image',
    provider: 'local',
    capabilities: ['photorealistic', '3d', 'artistic', 'logo'],
    quality: 10,
    speed: 'medium',
    vramRequired: 16,
    costPerImage: 0, // FREE (self-hosted)
  },
  {
    id: 'controlnet-canny',
    name: 'ControlNet (Canny Edge)',
    type: 'image-to-image',
    provider: 'local',
    capabilities: ['logo', 'precise-composition'],
    quality: 9,
    speed: 'medium',
    vramRequired: 10,
    costPerImage: 0,
  },
];

const FALLBACK_MODELS: ModelConfig[] = [
  {
    id: 'dalle-3',
    name: 'DALL-E 3 (OpenRouter)',
    type: 'text-to-image',
    provider: 'openrouter',
    capabilities: ['photorealistic', '3d', 'logo', 'scientific'],
    quality: 10,
    speed: 'medium',
    vramRequired: 0,
    costPerImage: 0.04, // $0.04 per image
  },
];
```

#### Model Download & Setup

```bash
# Create models directory
mkdir -p /opt/9jai/models

# Download Stable Diffusion XL Turbo (~7GB)
cd /opt/9jai/models
wget https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors

# Download FLUX Schnell (~24GB)
wget https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors

# Download ControlNet (~5GB)
wget https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_canny.pth

# Setup inference server
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI
python -m venv venv
source venv/bin/activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt

# Start server
python main.py --listen 0.0.0.0 --port 7860
```

---

### PHASE 3: Native AI Engine Implementation (Week 2-3)

Create new backend engine that uses self-hosted models:

```typescript
// functions/src/media/nativeAIEngine.ts
import fetch from 'node-fetch';

const COMFYUI_ENDPOINT = process.env.COMFYUI_ENDPOINT || 'http://localhost:7860';
const GPU_API_KEY = process.env.GPU_API_KEY; // For RunPod/Vast.ai authentication

export interface NativeGenerationRequest {
  prompt: string;
  imageType: ImageType;
  width: number;
  height: number;
  model?: string;
  steps?: number;
  cfg_scale?: number;
}

export interface NativeGenerationResult {
  imageBase64: string;
  model: string;
  inferenceTimeMs: number;
  source: 'native-gpu' | 'native-cpu' | 'fallback';
  metadata: {
    seed: number;
    steps: number;
    cfg_scale: number;
    sampler: string;
  };
}

type ImageType = 
  | 'photorealistic' 
  | '3d-render' 
  | 'logo' 
  | 'illustration' 
  | 'scientific' 
  | 'typography' 
  | 'hybrid';

/**
 * Select best model for image type
 */
function selectModelForType(imageType: ImageType): string {
  const modelMap: Record<ImageType, string> = {
    'photorealistic': 'flux-dev',
    '3d-render': 'flux-dev',
    'logo': 'controlnet-canny',
    'illustration': 'sdxl-turbo',
    'scientific': 'flux-dev',
    'typography': 'hybrid-pipeline', // Special handling
    'hybrid': 'flux-schnell',
  };
  
  return modelMap[imageType] || 'sdxl-turbo';
}

/**
 * Generate image using native GPU infrastructure
 */
export async function generateImageNative(
  request: NativeGenerationRequest
): Promise<NativeGenerationResult> {
  const startTime = Date.now();
  
  // Classify image type if not provided
  const imageType = request.imageType || classifyImageType(request.prompt);
  
  // Select appropriate model
  const model = request.model || selectModelForType(imageType);
  
  // For hybrid designs (logos, flyers), use special pipeline
  if (imageType === 'hybrid' || imageType === 'logo' || imageType === 'typography') {
    return generateHybridDesign(request);
  }
  
  // Build ComfyUI workflow
  const workflow = buildComfyUIWorkflow({
    prompt: enhancePromptForQuality(request.prompt, imageType),
    model,
    width: request.width,
    height: request.height,
    steps: request.steps || 20,
    cfg_scale: request.cfg_scale || 7.5,
  });
  
  // Submit to ComfyUI
  const response = await fetch(`${COMFYUI_ENDPOINT}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(GPU_API_KEY && { 'Authorization': `Bearer ${GPU_API_KEY}` }),
    },
    body: JSON.stringify({ prompt: workflow }),
  });
  
  if (!response.ok) {
    throw new Error(`ComfyUI request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const promptId = data.prompt_id;
  
  // Poll for completion
  const imageBase64 = await pollForCompletion(promptId);
  
  const inferenceTimeMs = Date.now() - startTime;
  
  return {
    imageBase64,
    model,
    inferenceTimeMs,
    source: 'native-gpu',
    metadata: {
      seed: Math.floor(Math.random() * 1000000),
      steps: request.steps || 20,
      cfg_scale: request.cfg_scale || 7.5,
      sampler: 'euler_ancestral',
    },
  };
}

/**
 * Build ComfyUI workflow JSON
 */
function buildComfyUIWorkflow(params: {
  prompt: string;
  model: string;
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
}): any {
  // This is a simplified workflow structure
  // Real ComfyUI workflows are complex JSON with node connections
  return {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": {
        "ckpt_name": `${params.model}.safetensors`
      }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": params.prompt,
        "clip": ["1", 1]
      }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "low quality, blurry, distorted, watermark",
        "clip": ["1", 1]
      }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": params.width,
        "height": params.height,
        "batch_size": 1
      }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "seed": Math.floor(Math.random() * 1000000),
        "steps": params.steps,
        "cfg": params.cfg_scale,
        "sampler_name": "euler_ancestral",
        "scheduler": "normal",
        "denoise": 1.0,
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0]
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      }
    },
    "7": {
      "class_type": "SaveImage",
      "inputs": {
        "filename_prefix": "9jai",
        "images": ["6", 0]
      }
    }
  };
}

/**
 * Poll ComfyUI for completion and get image
 */
async function pollForCompletion(promptId: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
    
    const response = await fetch(`${COMFYUI_ENDPOINT}/history/${promptId}`);
    const data = await response.json();
    
    if (data[promptId] && data[promptId].status?.completed) {
      // Get output image
      const outputs = data[promptId].outputs;
      const imageNode = Object.values(outputs).find((node: any) => node.images);
      
      if (imageNode && (imageNode as any).images[0]) {
        const imageFilename = (imageNode as any).images[0].filename;
        const imageResponse = await fetch(`${COMFYUI_ENDPOINT}/view?filename=${imageFilename}`);
        const imageBuffer = await imageResponse.arrayBuffer();
        return `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      }
    }
  }
  
  throw new Error('Image generation timed out');
}

/**
 * Classify image type from prompt
 */
function classifyImageType(prompt: string): ImageType {
  const lower = prompt.toLowerCase();
  
  if (/\b(logo|brand|emblem|icon)\b/.test(lower)) return 'logo';
  if (/\b(3d|render|modeling|blender)\b/.test(lower)) return '3d-render';
  if (/\b(photo|realistic|portrait|landscape)\b/.test(lower)) return 'photorealistic';
  if (/\b(scientific|diagram|chart|medical)\b/.test(lower)) return 'scientific';
  if (/\b(cartoon|illustration|drawing)\b/.test(lower)) return 'illustration';
  if (/\b(flyer|poster|business card|ad)\b/.test(lower)) return 'hybrid';
  
  return 'photorealistic';
}

/**
 * Enhance prompt with quality modifiers
 */
function enhancePromptForQuality(prompt: string, imageType: ImageType): string {
  const qualityModifiers: Record<ImageType, string> = {
    'photorealistic': 'masterpiece, best quality, ultra detailed, 8k uhd, photorealistic, professional photography, dramatic lighting',
    '3d-render': 'professional 3D render, octane render, unreal engine 5, raytracing, subsurface scattering, volumetric lighting, 8k',
    'logo': 'minimalist logo design, vector graphic, clean lines, iconic, professional branding, high contrast',
    'illustration': 'beautiful illustration, detailed artwork, vibrant colors, professional digital art, trending on artstation',
    'scientific': 'scientific illustration, technical diagram, accurate, detailed, professional medical visualization',
    'typography': 'clean typography, modern font design, professional graphic design',
    'hybrid': 'professional graphic design, commercial quality, print ready, high resolution',
  };
  
  return `${prompt}, ${qualityModifiers[imageType]}`;
}

/**
 * Generate hybrid design (AI + Typography)
 * For logos, flyers, business cards, etc.
 */
async function generateHybridDesign(
  request: NativeGenerationRequest
): Promise<NativeGenerationResult> {
  const startTime = Date.now();
  
  // Step 1: Generate AI background/artwork
  const backgroundPrompt = extractBackgroundPrompt(request.prompt);
  const background = await generateImageNative({
    ...request,
    prompt: backgroundPrompt,
    imageType: 'illustration',
  });
  
  // Step 2: Extract typography requirements
  const textElements = extractTextElements(request.prompt);
  
  // Step 3: Compose with typography (THIS REQUIRES CLIENT-SIDE OR SEPARATE SERVICE)
  // For now, return just the background with metadata about text overlay needed
  // Real implementation would use Sharp/Canvas/SVG library to compose
  
  const inferenceTimeMs = Date.now() - startTime;
  
  return {
    ...background,
    source: 'native-gpu',
    inferenceTimeMs,
    metadata: {
      ...background.metadata,
      // Add typography metadata for client-side rendering
      textOverlay: textElements,
    },
  };
}

function extractBackgroundPrompt(prompt: string): string {
  // Remove text content, keep visual description
  return prompt.replace(/"[^"]*"/g, '').trim();
}

function extractTextElements(prompt: string): any[] {
  // Extract quoted text for typography overlay
  const matches = prompt.match(/"([^"]*)"/g);
  if (!matches) return [];
  
  return matches.map(text => ({
    text: text.replace(/"/g, ''),
    position: 'center',
    style: 'bold',
  }));
}
```

---

### PHASE 4: Backend Integration (Week 3)

Update the existing media engine to use native AI first:

```typescript
// functions/src/media/engine.ts (UPDATED)
import { generateImageNative } from './nativeAIEngine';
import { openRouterImage } from '../providers/openrouter';
import { pollinationsWithFallback } from '../providers/pollinations';

export async function generateMedia(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
  const startTime = Date.now();
  
  if (request.kind === 'image' && request.prompt) {
    const providers = [
      {
        name: 'native-gpu',
        fn: async () => {
          console.log('[MediaEngine] PRIMARY: Native GPU generation');
          const result = await generateImageNative({
            prompt: request.prompt!,
            imageType: 'photorealistic', // Auto-detected internally
            width: 1024,
            height: 1024,
          });
          return {
            imageBase64: result.imageBase64,
            model: result.model,
            source: result.source,
          };
        }
      },
      {
        name: 'openrouter',
        fn: async () => {
          console.log('[MediaEngine] FALLBACK 1: OpenRouter DALL-E 3 ($0.04)');
          const result = await openRouterImage(request.prompt!);
          return { imageUrl: result.imageUrl, model: result.model };
        }
      },
      { 
        name: 'pollinations', 
        fn: async () => {
          console.log('[MediaEngine] FALLBACK 2: Pollinations (FREE)');
          const result = await pollinationsWithFallback(request.prompt!);
          return { imageBase64: result.imageBase64, imageUrl: result.url, model: result.model };
        }
      },
    ];

    for (const provider of providers) {
      try {
        console.log(`[MediaEngine] Trying ${provider.name}`);
        const result = await provider.fn();
        
        if (result && (result.imageUrl || result.imageBase64)) {
          const latencyMs = Date.now() - startTime;
          console.log(`[MediaEngine] ✓ Success with ${provider.name} in ${latencyMs}ms`);
          
          return {
            kind: 'image',
            provider: provider.name as ProviderId,
            model: result.model || provider.name,
            latencyMs,
            imageBase64: (result as any).imageBase64,
            mediaUrl: result.imageUrl || (result as any).imageBase64,
          };
        }
      } catch (error: any) {
        console.warn(`[MediaEngine] ✗ ${provider.name} failed:`, error.message);
        continue;
      }
    }
  }

  throw new Error(`${request.kind} generation failed: all providers exhausted`);
}
```

---

### PHASE 5: Frontend Updates (Week 3)

No major changes needed! The frontend already handles base64 images correctly.

Just update metadata display:

```typescript
// src/components/ImageBubble.tsx (ADD METADATA)
<div className="px-3 py-2 bg-[#0a1a12] border-t border-[#008751]/20">
  <div className="text-[9px] text-green-600 flex items-center gap-2">
    <span className="font-bold">
      {result.provider === 'native-gpu' ? '🖥️ 9JAI GPU' : 
       result.provider === 'openrouter' ? '☁️ DALL-E 3' : 
       '🌐 Pollinations'}
    </span>
    <span>·</span>
    <span>{result.model}</span>
    <span>·</span>
    <span>{result.latencyMs}ms</span>
  </div>
</div>
```

---

### PHASE 6: Testing & Validation (Week 4)

#### Physical Testing Checklist
- [ ] Generate photorealistic image (portrait, landscape)
- [ ] Generate 3D render image
- [ ] Generate logo design
- [ ] Generate flyer with text
- [ ] Generate scientific diagram
- [ ] Verify images are TRULY AI-generated (not stock photos)
- [ ] Verify metadata shows correct source (`native-gpu`)
- [ ] Test fallback chain when GPU is offline
- [ ] Measure generation time (should be 5-15 seconds)
- [ ] Measure image quality (compare to reference images)

#### Quality Validation
```typescript
// Validate that image is actually generated
function validateGeneratedImage(imageBase64: string, prompt: string): boolean {
  // 1. Check it's not an SVG placeholder
  if (imageBase64.startsWith('data:image/svg+xml')) {
    console.error('[Validation] FAIL: Image is SVG placeholder, not generated');
    return false;
  }
  
  // 2. Check file size (real AI images are typically 500KB-2MB)
  const sizeKB = (imageBase64.length * 0.75) / 1024; // base64 to bytes
  if (sizeKB < 50) {
    console.error('[Validation] FAIL: Image too small, likely placeholder');
    return false;
  }
  
  // 3. Check metadata contains generation info
  // Real AI images should have metadata in response
  
  console.log('[Validation] PASS: Image appears to be AI-generated');
  return true;
}
```

---

## DEPLOYMENT ROADMAP

### Week 1: Infrastructure
- [ ] Set up RunPod GPU pod (RTX 3090/4090)
- [ ] Install ComfyUI with models
- [ ] Configure networking/API access
- [ ] Test basic generation from curl/Postman

### Week 2: Backend Development
- [ ] Implement `nativeAIEngine.ts`
- [ ] Update `media/engine.ts` to use native as primary
- [ ] Test with real GPU
- [ ] Deploy to Firebase Functions with GPU endpoint

### Week 3: Integration & Frontend
- [ ] Connect frontend to new backend
- [ ] Add metadata display
- [ ] Test full user flow
- [ ] Fix any issues

### Week 4: Testing & Launch
- [ ] Physical testing of all image types
- [ ] Load testing (concurrent requests)
- [ ] Cost analysis (GPU usage vs API costs)
- [ ] User acceptance testing
- [ ] Production deployment

---

## COST COMPARISON

### Current System (100 users, 10 images/day each)
- OpenRouter DALL-E 3: **$1,200/month**
- Pollinations: **$0** (but returning 403 errors, unreliable)
- **Total: $1,200/month** (unsustainable)

### New System (Native GPU)
- RunPod On-Demand (10 hours/day): **$90/month**
- Self-Hosted RTX 4090 (electricity): **$30/month**
- OpenRouter Fallback (5% usage): **$60/month**
- **Total: $90-120/month** (10x cheaper!)

### Break-Even Analysis
- Self-hosted GPU pays for itself after 2 months
- After 1 year: Save ~$12,000 compared to pure API approach

---

## IMMEDIATE NEXT STEPS

1. **SET UP GPU POD** (Today)
   - Sign up for RunPod: https://runpod.io
   - Deploy ComfyUI template
   - Test basic generation

2. **IMPLEMENT NATIVE ENGINE** (Tomorrow)
   - Create `functions/src/media/nativeAIEngine.ts`
   - Connect to GPU endpoint
   - Test from backend

3. **UPDATE ROUTING** (Day 3)
   - Modify `functions/src/media/engine.ts`
   - Make native GPU primary
   - Deploy to staging

4. **PHYSICAL TESTING** (Day 4)
   - Generate test images
   - Verify they're real AI generations
   - Document results

5. **PRODUCTION DEPLOY** (Day 5)
   - Deploy to production
   - Monitor for issues
   - Collect user feedback

---

## CRITICAL SUCCESS FACTORS

✅ **MUST HAVE:**
- Self-hosted GPU infrastructure (RunPod or physical)
- Native AI models (SDXL, FLUX, etc.)
- Image type classification
- Physical testing before claiming "works"
- Honest metadata (source, model, generation method)

❌ **MUST NOT:**
- Claim SVG placeholders are "AI-generated"
- Use external APIs as primary (only fallback)
- Skip physical testing
- Lie about what the system actually does

---

## QUESTIONS TO RESOLVE

1. **GPU Hosting**: RunPod vs self-hosted vs hybrid?
2. **Model Selection**: Start with SDXL Turbo or FLUX Schnell?
3. **Hybrid Pipeline**: Build in backend (Sharp/Canvas) or frontend (HTML Canvas)?
4. **Rate Limiting**: Keep current quota system or remove for native generation?
5. **Quality Threshold**: What's the minimum acceptable image quality?

---

## CONCLUSION

The current system **DOES NOT** meet requirements because:
1. It returns SVG placeholders or stock images, not AI-generated content
2. External APIs are primary, not fallback
3. No native AI infrastructure
4. Fundamentally dishonest about capabilities

The new system **WILL** meet requirements by:
1. Using self-hosted GPU models as PRIMARY
2. Generating REAL AI images (physically testable)
3. Classifying image types and using appropriate models
4. Making external APIs OPTIONAL fallbacks only
5. Being honest about what actually happens

**Estimated Timeline**: 4 weeks to full production
**Estimated Cost**: $90-120/month (vs $1,200/month current)
**Risk Level**: Medium (requires GPU setup, but proven technology)

---

**READY TO START?** Let's begin with Phase 1: GPU Infrastructure Setup.
