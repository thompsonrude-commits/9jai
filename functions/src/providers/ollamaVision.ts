/**
 * Ollama Vision Provider — FREE, LOCAL, NO API KEY REQUIRED
 * 
 * Vision Models:
 * - llava (7B, 13B) - Visual understanding
 * - llava-phi3 (3.8B) - Faster, lightweight
 * - bakllava (7B) - Alternative vision model
 * 
 * Installation:
 *   ollama pull llava
 *   ollama pull bakllava
 * 
 * FREE-FIRST COMPLIANCE: ✅ YES
 */

import { isOllamaAvailable } from './ollama';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const VISION_MODELS = ['llava', 'llava:13b', 'llava-phi3', 'bakllava'];

/**
 * Analyze image with Ollama vision model
 */
export async function ollamaVisionAnalyze(
  imageBase64: string,
  prompt: string,
  model = 'llava'
): Promise<{ text: string; model: string }> {
  // Remove data URL prefix if present
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      images: [cleanBase64],
      stream: false,
    }),
    signal: AbortSignal.timeout(60000),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama vision failed: ${response.status} ${error}`);
  }
  
  const data = await response.json() as { response: string };
  return {
    text: data.response,
    model,
  };
}

/**
 * Analyze image with model fallback
 */
export async function ollamaVisionWithFallback(
  imageBase64: string,
  prompt: string
): Promise<{ text: string; model: string }> {
  // Check if Ollama is available
  if (!(await isOllamaAvailable())) {
    throw new Error('Ollama service is not available');
  }
  
  // Get available models
  const availableModels = await getAvailableVisionModels();
  
  if (availableModels.length === 0) {
    throw new Error('No Ollama vision models available. Run: ollama pull llava');
  }
  
  // Try each model
  for (const model of availableModels) {
    try {
      return await ollamaVisionAnalyze(imageBase64, prompt, model);
    } catch (err: any) {
      console.warn(`[OllamaVision] Model ${model} failed:`, err.message);
      continue;
    }
  }
  
  throw new Error('All Ollama vision models failed');
}

/**
 * Get available vision models
 */
async function getAvailableVisionModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    
    const data = await response.json() as { models: Array<{ name: string }> };
    const allModels = (data.models || []).map((m) => m.name);
    
    // Filter for vision models
    return allModels.filter((name: string) =>
      VISION_MODELS.some(vm => name.startsWith(vm))
    );
  } catch {
    return [];
  }
}

/**
 * Describe image (general purpose)
 */
export async function describeImage(imageBase64: string): Promise<string> {
  const result = await ollamaVisionWithFallback(
    imageBase64,
    'Describe this image in detail. What do you see?'
  );
  return result.text;
}

/**
 * Answer question about image
 */
export async function answerImageQuestion(
  imageBase64: string,
  question: string
): Promise<string> {
  const result = await ollamaVisionWithFallback(imageBase64, question);
  return result.text;
}

/**
 * Detect objects in image
 */
export async function detectObjects(imageBase64: string): Promise<string> {
  const result = await ollamaVisionWithFallback(
    imageBase64,
    'List all objects you can identify in this image.'
  );
  return result.text;
}

/**
 * Read text from image (OCR-like, but vision-based)
 */
export async function readImageText(imageBase64: string): Promise<string> {
  const result = await ollamaVisionWithFallback(
    imageBase64,
    'Extract all text visible in this image. Return only the text, nothing else.'
  );
  return result.text;
}

