import { AIOrchestrator } from '../../9ja-ai/9ja-ai-core/orchestrator/AIOrchestrator.ts';
import { ConsoleLogger } from '../../9ja-ai/9ja-ai-core/logging/Logger.ts';
import { LanguageEngineAdapter } from '../../9ja-ai/9ja-ai-core/engines/language/LanguageEngine.ts';
import type { AIRequest } from '../../9ja-ai/9ja-ai-core/types.ts';
import type { ProxyChatMessage } from './aiProxy';
import { buildPollinationsImageUrl } from './imageService';

export interface OrchestratedChatResult {
  text: string;
  provider: 'orchestrator';
  metadata?: Record<string, unknown>;
}

export interface OrchestratedImageResult {
  imageUrl: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface OrchestratedVisionResult {
  text: string;
  description: string;
  objects: string[];
  provider: string;
  model: string;
}

export interface OrchestratedOCRResult {
  text: string;
  confidence: number;
  provider: string;
  model: string;
}

let orchestrator: AIOrchestrator | null = null;

function getOrchestrator(): AIOrchestrator {
  if (!orchestrator) {
    const languageEngine = new LanguageEngineAdapter();

    orchestrator = new AIOrchestrator({
      logger: new ConsoleLogger(),
      engines: {
        language: {
          kind: 'language',
          execute: async (request: AIRequest) => {
            const payload = (request.payload ?? {}) as Record<string, unknown>;
            switch (request.operation) {
              case 'reason':
                return languageEngine.reason(payload);
              case 'code':
                return languageEngine.code(payload);
              case 'summarize':
                return languageEngine.summarize(payload);
              case 'write':
                return languageEngine.write(payload);
              default:
                return languageEngine.chat(payload);
            }
          },
        },
        image: {
          kind: 'image',
          execute: async (request: AIRequest) => {
            const payload = request.payload as { prompt: string };
            const startTime = Date.now();
            
            console.log('[ImageEngine] Generating image with prompt:', payload.prompt);
            
                // Use backend canonical image generation endpoint. Backend decides provider and authoritative ComfyUI usage.
                try {
                  const resp = await fetch('/api/v1/image/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: payload.prompt }),
                    signal: AbortSignal.timeout(120000),
                  });

                  if (!resp.ok) {
                    // If backend reports ComfyUI-authoritative failure (503 with provider=comfyui), do NOT fallback to Pollinations
                    try {
                      const errBody = await resp.json();
                      if (errBody && errBody.provider === 'comfyui' && errBody.success === false) {
                        // Surface an error result so callers can handle it and not treat this as a generated image
                        return { imageUrl: '', provider: 'comfyui', model: 'none', latencyMs: Date.now() - startTime };
                      }
                    } catch (e) {
                      // ignore parse errors
                    }
                    console.warn('[ImageEngine] backend /api/v1/image/generate returned non-OK:', resp.status);
                  } else {
                    const data = await resp.json();
                    if (data.imageUrl) {
                      return { imageUrl: data.imageUrl, provider: data.provider || 'backend', model: data.model || data.provider, latencyMs: Date.now() - startTime };
                    }
                    if (data.generationId) {
                      // Client should poll /api/images/status/:generationId to obtain final image — return a placeholder with generationId in imageUrl field
                      return { imageUrl: `/api/images/status/${data.generationId}`, provider: data.provider || 'backend', model: data.model || data.provider || 'unknown', latencyMs: Date.now() - startTime };
                    }
                  }
                } catch (err) {
                  console.warn('[ImageEngine] Backend generation failed, falling back to Pollinations');
                }

                // Fallback: Pollinations
                const imageUrl = buildPollinationsImageUrl(payload.prompt);
                console.log('[ImageEngine] Image URL generated (fallback):', imageUrl);
            
                return {
                  imageUrl,
                  provider: 'pollinations',
                  model: 'flux',
                  latencyMs: Date.now() - startTime,
                };
          },
        },
        vision: {
          kind: 'vision',
          execute: async (request: AIRequest) => {
            const payload = request.payload as { imageData: string; prompt?: string };
            
            // Try backend first
            try {
              const response = await fetch('/api/ai/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: payload.imageData, prompt: payload.prompt }),
                signal: AbortSignal.timeout(90000),
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.text || data.description) {
                  return {
                    text: data.text || data.description || '',
                    description: data.description || data.text || '',
                    objects: data.objects || [],
                    provider: data.provider || 'backend',
                    model: data.model || 'unknown',
                  };
                }
              }
            } catch (err) {
              console.warn('[VisionEngine] Backend failed, using AI-powered analysis');
            }
            
            // Fallback: Use AI to analyze image description from user
            try {
              const chatPrompt = payload.prompt || 'Describe this image in detail';
              const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  task: 'chat',
                  messages: [
                    { role: 'system', content: 'You are a helpful AI assistant. When analyzing images, provide detailed descriptions based on context clues from the user.' },
                    { role: 'user', content: `${chatPrompt}\n\nNote: I have uploaded an image. While I cannot directly see images, I can help analyze what you describe or answer questions about images in general.` }
                  ],
                }),
              });
              
              if (response.ok) {
                const data = await response.json();
                return {
                  text: data.text || 'I can see an image has been uploaded. For detailed vision analysis, please configure a vision backend (Ollama with llava model recommended).',
                  description: 'AI-powered contextual analysis',
                  objects: [],
                  provider: 'ai-fallback',
                  model: 'text-analysis',
                };
              }
            } catch (err) {
              console.warn('[VisionEngine] AI fallback failed');
            }
            
            // Final fallback
            return {
              text: 'I can see an image has been uploaded. For detailed vision analysis, please configure a vision backend with Ollama + llava model. Install Ollama from https://ollama.ai and run: ollama pull llava',
              description: 'Basic image recognition',
              objects: [],
              provider: 'fallback',
              model: 'basic',
            };
          },
        },
        ocr: {
          kind: 'ocr',
          execute: async (request: AIRequest) => {
            const payload = request.payload as { imageData: string };
            
            // Try backend
            try {
              const response = await fetch('/api/v1/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: payload.imageData }),
                signal: AbortSignal.timeout(120000),
              });
              
              if (response.ok) {
                const data = await response.json();
                return {
                  text: data.text || data.rawText || '',
                  confidence: data.confidence || 0,
                  provider: data.provider || 'backend',
                  model: data.model || 'unknown',
                };
              }
            } catch (err) {
              console.warn('[OCREngine] Backend failed');
            }
            
            // Fallback message (Tesseract.js would need to be loaded dynamically at runtime)
            return {
              text: 'Could not extract text from image. OCR backend is currently unavailable. Please configure the v1Ocr endpoint with Tesseract or another OCR provider.',
              confidence: 0,
              provider: 'unavailable',
              model: 'none',
            };
          },
        },
        speech: {
          kind: 'speech',
          execute: async (request: AIRequest) => {
            const payload = request.payload as { audioData?: string; text?: string };
            
            if (request.operation === 'transcribe') {
              // Speech-to-text
              try {
                const response = await fetch('/api/ai/transcribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audioData: payload.audioData }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  return { text: data.text || '', provider: data.provider || 'backend' };
                }
              } catch (err) {
                console.warn('[SpeechEngine] Transcription failed');
              }
              
              return { text: 'Speech recognition unavailable', provider: 'unavailable' };
            } else {
              // Text-to-speech
              try {
                const response = await fetch('/api/ai/tts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: payload.text }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  return { audioUrl: data.audioUrl, provider: data.provider || 'backend' };
                }
              } catch (err) {
                console.warn('[SpeechEngine] TTS failed');
              }
              
              return { audioUrl: null, provider: 'unavailable' };
            }
          },
        },
        video: {
          kind: 'video',
          execute: async (request: AIRequest) => {
            const payload = request.payload as { prompt: string };
            
            // Try backend
            try {
              const response = await fetch('/api/ai/video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: payload.prompt }),
                signal: AbortSignal.timeout(90000),
              });
              
              if (response.ok) {
                const data = await response.json();
                return {
                  videoUrl: data.outputUrl || data.videoUrl,
                  provider: data.provider || 'backend',
                  model: data.model || 'unknown',
                };
              }
            } catch (err) {
              console.warn('[VideoEngine] Backend failed');
            }
            
            // Fallback: generate image instead
            const imageUrl = buildPollinationsImageUrl(payload.prompt);
            return {
              videoUrl: imageUrl,
              provider: 'image-fallback',
              model: 'static-image',
              note: 'Video generation unavailable, showing static image instead',
            };
          },
        },
      },
    });
  }

  return orchestrator;
}

export function buildOrchestratorRequest(messages: ProxyChatMessage[], temperature = 0.7): AIRequest {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const prompt = lastUserMessage?.content ?? '';

  return {
    id: `orchestrator-${Date.now()}`,
    source: 'android-app',
    kind: 'language',
    operation: 'chat',
    payload: {
      prompt,
      context: {
        messages,
        temperature,
      },
    },
    metadata: {
      temperature,
      source: 'android-app',
    },
  };
}

export async function getOrchestratedChatResponse(messages: ProxyChatMessage[], temperature = 0.7): Promise<OrchestratedChatResult | null> {
  try {
    const request = buildOrchestratorRequest(messages, temperature);
    const response = await getOrchestrator().handleRequest(request);
    const data = response.data as { output?: string } | undefined;
    const text = typeof data?.output === 'string' ? data.output : '';

    if (!text) {
      return null;
    }

    return {
      text,
      provider: 'orchestrator',
      metadata: response.metadata,
    };
  } catch (error) {
    console.warn('[AIOrchestratorBridge] orchestrated chat failed:', error);
    return null;
  }
}

// Image generation — calls Gemini backend directly, reads correct response shape
export async function generateImageViaOrchestrator(prompt: string): Promise<OrchestratedImageResult> {
  const startTime = Date.now();

  try {
    const resp = await fetch('/api/v1/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, preferredProviders: ['gemini'] }),
      signal: AbortSignal.timeout(60000),
    });
    
    if (resp.ok) {
      const data = await resp.json();
      // Backend returns: { success, provider, model, imageBase64, mediaUrl }
      const imageUrl = data.imageBase64 || data.mediaUrl;
      if (imageUrl && data.success !== false) {
        console.log('[ImageGen] Provider:', data.provider, data.fallbackFrom ? `fallback from ${data.fallbackFrom}` : '');
        return {
          imageUrl,
          provider: data.provider || 'gemini',
          model: data.model || 'gemini',
          latencyMs: Date.now() - startTime,
        };
      }
    }
  } catch (err) {
    console.warn('[ImageGen] Backend failed, using Pollinations fallback');
  }

  // Fallback: Pollinations
  const imageUrl = buildPollinationsImageUrl(prompt);
  return { imageUrl, provider: 'pollinations', model: 'flux', latencyMs: Date.now() - startTime };
}

// NEW: Vision analysis via orchestrator
export async function analyzeImageViaOrchestrator(imageData: string, prompt?: string): Promise<OrchestratedVisionResult> {
  const request: AIRequest = {
    id: `vision-${Date.now()}`,
    source: 'web',
    kind: 'vision',
    operation: 'analyze',
    payload: { imageData, prompt },
  };
  
  const response = await getOrchestrator().handleRequest(request);
  return response.data as OrchestratedVisionResult;
}

// NEW: OCR extraction via orchestrator
export async function extractTextViaOrchestrator(imageData: string): Promise<OrchestratedOCRResult> {
  const request: AIRequest = {
    id: `ocr-${Date.now()}`,
    source: 'web',
    kind: 'ocr',
    operation: 'extract',
    payload: { imageData },
  };
  
  const response = await getOrchestrator().handleRequest(request);
  return response.data as OrchestratedOCRResult;
}

// NEW: Speech transcription via orchestrator
export async function transcribeAudioViaOrchestrator(audioData: string): Promise<{ text: string; provider: string }> {
  const request: AIRequest = {
    id: `speech-${Date.now()}`,
    source: 'web',
    kind: 'speech',
    operation: 'transcribe',
    payload: { audioData },
  };
  
  const response = await getOrchestrator().handleRequest(request);
  return response.data as { text: string; provider: string };
}

// NEW: Video generation via orchestrator
export async function generateVideoViaOrchestrator(prompt: string): Promise<{ videoUrl: string; provider: string; model: string }> {
  const request: AIRequest = {
    id: `video-${Date.now()}`,
    source: 'web',
    kind: 'video',
    operation: 'generate',
    payload: { prompt },
  };
  
  const response = await getOrchestrator().handleRequest(request);
  return response.data as { videoUrl: string; provider: string; model: string };
}
