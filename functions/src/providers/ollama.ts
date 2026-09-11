/**
 * Ollama Provider — FREE, LOCAL, NO API KEY REQUIRED
 * 
 * Ollama provides local AI inference with open models:
 * - llama3.2 (3B, 7B) - Fast general chat
 * - llama3.1 (8B, 70B) - Higher quality
 * - gemma2 (9B, 27B) - Google's models
 * - mistral (7B) - Fast and capable
 * 
 * Installation:
 *   curl -fsSL https://ollama.ai/install.sh | sh
 *   ollama pull llama3.2
 * 
 * REST API: http://localhost:11434
 * 
 * FREE-FIRST COMPLIANCE: ✅ YES
 * - No API key required
 * - No cost
 * - Local inference
 * - Open-source models
 */

import { ChatMessage } from '../types';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Default model selection - prefer locally-installed qwen3 when available
const DEFAULT_MODEL = 'qwen3:0.6b';
const FALLBACK_MODELS = [
  'qwen3:0.6b',
  'llama3.2:3b',
  'llama3.2',
  'llama3.1',
  'gemma2',
  'mistral',
  'llama2',
];

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get list of available models
 */
export async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    
    const data = await response.json() as { models: Array<{ name: string }> };
    return (data.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

/**
 * Select best available model
 */
async function selectModel(preferredModel?: string): Promise<string> {
  const available = await getOllamaModels();

  // Prefer exact preferredModel when available
  if (preferredModel) {
    const exact = available.find(m => m === preferredModel);
    if (exact) return exact;
  }

  // Prefer DEFAULT_MODEL if present
  const defaultExact = available.find(m => m === DEFAULT_MODEL || m.startsWith(DEFAULT_MODEL));
  if (defaultExact) return defaultExact;

  // Try fallback models in order, match exact or startsWith
  for (const model of FALLBACK_MODELS) {
    const exact = available.find(m => m === model);
    if (exact) return exact;
    const starts = available.find(m => m.startsWith(model));
    if (starts) return starts;
  }

  // If none matched, return first available
  if (available.length > 0) return available[0];

  throw new Error('No Ollama models available. Run: ollama pull <model>');
}

/**
 * Normalize messages to Ollama format
 */
function normalizeMessages(messages: ChatMessage[]): OllamaMessage[] {
  return messages.map(msg => ({
    role: (msg.role as string) === 'model' ? 'assistant' : msg.role,
    content: msg.content,
  }));
}

function extractAssistantText(data: { message?: { content?: string | Array<{ text?: string }> } } | null | undefined): string {
  const content = data?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content
      .map(item => (typeof item?.text === 'string' ? item.text : ''))
      .join('')
      .trim();
  }
  return '';
}

/**
 * Chat with Ollama (non-streaming)
 */
export async function ollamaChat(
  messages: ChatMessage[],
  model?: string,
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  const selectedModel = await selectModel(model);
  const normalizedMessages = normalizeMessages(messages);
  
  const request: OllamaChatRequest = {
    model: selectedModel,
    messages: normalizedMessages,
    stream: false,
    options: {
      temperature,
      num_predict: maxTokens,
    },
  };
  
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60000), // 60s timeout
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama chat failed: ${response.status} ${error}`);
  }
  
  const data = await response.json() as OllamaChatResponse & { message?: { content?: string | Array<{ text?: string }> } };
  let text = extractAssistantText(data);

  // If the JSON response contains no text, try streaming endpoint to recover text
  if (!text) {
    try {
      const chunks: string[] = [];
      for await (const chunk of ollamaChatStream(messages, selectedModel, temperature, maxTokens)) {
        chunks.push(chunk);
      }
      text = chunks.join('').trim();
    } catch (streamErr) {
      // ignore - we'll throw below
    }
  }

  if (!text) {
    throw new Error(`Ollama model ${selectedModel} returned an empty response. Try another model.`);
  }

  return {
    text,
    model: selectedModel,
    tokensUsed: undefined, // Ollama doesn't return token count in non-streaming mode
  };
}

/**
 * Chat with Ollama with model fallback
 */
export async function ollamaChatWithFallback(
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; model: string; tokensUsed?: number }> {
  // Check if Ollama is available
  if (!(await isOllamaAvailable())) {
    throw new Error('Ollama service is not available. Please start Ollama: ollama serve');
  }
  
  // Try primary model
  try {
    return await ollamaChat(messages, undefined, temperature, maxTokens);
  } catch (primaryError: any) {
    console.warn('[Ollama] Primary model failed:', primaryError.message);
    
    // Try each fallback model
    for (const fallbackModel of FALLBACK_MODELS.slice(1)) {
      try {
        return await ollamaChat(messages, fallbackModel, temperature, maxTokens);
      } catch (fallbackError: any) {
        console.warn(`[Ollama] Fallback model ${fallbackModel} failed:`, fallbackError.message);
        continue;
      }
    }
    
    // All models failed
    throw new Error(`All Ollama models failed. Last error: ${primaryError.message}`);
  }
}

/**
 * Streaming chat with Ollama (for future SSE support)
 */
export async function* ollamaChatStream(
  messages: ChatMessage[],
  model?: string,
  temperature = 0.7,
  maxTokens = 2048
): AsyncGenerator<string> {
  const selectedModel = await selectModel(model);
  const normalizedMessages = normalizeMessages(messages);
  
  const request: OllamaChatRequest = {
    model: selectedModel,
    messages: normalizedMessages,
    stream: true,
    options: {
      temperature,
      num_predict: maxTokens,
    },
  };
  
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama stream failed: ${response.status} ${error}`);
  }
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const data: OllamaChatResponse = JSON.parse(line);
        if (data.message?.content) {
          yield data.message.content;
        }
      } catch {
        // Skip malformed JSON
        continue;
      }
    }
  }
}

/**
 * Generate embeddings with Ollama (for future semantic search)
 */
export async function ollamaEmbeddings(
  text: string,
  model = 'nomic-embed-text'
): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama embeddings failed: ${response.status}`);
  }
  
  const data = await response.json() as { embedding: number[] };
  return data.embedding;
}

/**
 * Pull a model from Ollama library (useful for setup)
 */
export async function ollamaPullModel(model: string): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to pull model ${model}`);
  }
  
  // Stream the pull progress (optional)
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    console.log('[Ollama] Pull progress:', text);
  }
}

