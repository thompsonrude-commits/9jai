/**
 * Provider Health Monitoring System
 * 
 * Tracks health status of all AI providers in real-time
 * Enables self-aware AI that knows its capabilities
 */

export interface ProviderStatus {
  id: string;
  name: string;
  type: 'chat' | 'vision' | 'ocr' | 'search' | 'time' | 'weather' | 'image' | 'voice';
  available: boolean;
  lastChecked: number;
  lastSuccess?: number;
  lastFailure?: number;
  consecutiveFailures: number;
  responseTime?: number; // ms
  errorMessage?: string;
}

export interface SystemCapabilities {
  chat: boolean;
  vision: boolean;
  ocr: boolean;
  search: boolean;
  time: boolean;
  weather: boolean;
  imageGeneration: boolean;
  textToSpeech: boolean;
  speechToText: boolean;
  translation: boolean;
}

// In-memory provider status
const providerStatuses = new Map<string, ProviderStatus>();

// System capabilities cache
let cachedCapabilities: SystemCapabilities | null = null;
let capabilitiesCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Initialize provider status
 */
export function initializeProvider(
  id: string,
  name: string,
  type: ProviderStatus['type']
): void {
  if (!providerStatuses.has(id)) {
    providerStatuses.set(id, {
      id,
      name,
      type,
      available: true, // Assume available initially
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    });
  }
}

/**
 * Record successful provider call
 */
export function recordProviderSuccess(
  id: string,
  responseTime?: number
): void {
  const status = providerStatuses.get(id);
  if (status) {
    status.available = true;
    status.lastSuccess = Date.now();
    status.lastChecked = Date.now();
    status.consecutiveFailures = 0;
    status.responseTime = responseTime;
    status.errorMessage = undefined;
    providerStatuses.set(id, status);
  }
  
  // Invalidate capabilities cache
  cachedCapabilities = null;
}

/**
 * Record failed provider call
 */
export function recordProviderFailure(
  id: string,
  errorMessage: string
): void {
  const status = providerStatuses.get(id);
  if (status) {
    status.lastFailure = Date.now();
    status.lastChecked = Date.now();
    status.consecutiveFailures++;
    status.errorMessage = errorMessage;
    
    // Mark as unavailable after 3 consecutive failures
    if (status.consecutiveFailures >= 3) {
      status.available = false;
    }
    
    providerStatuses.set(id, status);
  }
  
  // Invalidate capabilities cache
  cachedCapabilities = null;
}

/**
 * Check if provider is available
 */
export function isProviderAvailable(id: string): boolean {
  const status = providerStatuses.get(id);
  return status?.available ?? false;
}

/**
 * Get provider status
 */
export function getProviderStatus(id: string): ProviderStatus | undefined {
  return providerStatuses.get(id);
}

/**
 * Get all provider statuses
 */
export function getAllProviderStatuses(): ProviderStatus[] {
  return Array.from(providerStatuses.values());
}

/**
 * Check system capabilities
 */
export async function getSystemCapabilities(): Promise<SystemCapabilities> {
  // Return cached if fresh
  const now = Date.now();
  if (cachedCapabilities && (now - capabilitiesCacheTime) < CACHE_TTL) {
    return cachedCapabilities;
  }
  
  // Check each capability
  const capabilities: SystemCapabilities = {
    chat: await checkChatCapability(),
    vision: await checkVisionCapability(),
    ocr: await checkOCRCapability(),
    search: await checkSearchCapability(),
    time: await checkTimeCapability(),
    weather: await checkWeatherCapability(),
    imageGeneration: await checkImageCapability(),
    textToSpeech: checkTTSCapability(),
    speechToText: checkSTTCapability(),
    translation: await checkTranslationCapability(),
  };
  
  // Cache the result
  cachedCapabilities = capabilities;
  capabilitiesCacheTime = now;
  
  return capabilities;
}

/**
 * Check if chat is available
 */
async function checkChatCapability(): Promise<boolean> {
  // Check if Ollama provider is available
  const ollamaStatus = providerStatuses.get('ollama');
  if (ollamaStatus?.available) return true;
  
  // Check active fallback providers only.
  const fallbacks = ['grok', 'groq', 'openrouter', 'together'];
  return fallbacks.some(id => providerStatuses.get(id)?.available);
}

/**
 * Check if vision is available
 */
async function checkVisionCapability(): Promise<boolean> {
  const ollamaVision = providerStatuses.get('ollama-vision');
  const groq = providerStatuses.get('groq');
  return (ollamaVision?.available ?? false) || (groq?.available ?? false);
}

/**
 * Check if OCR is available
 */
async function checkOCRCapability(): Promise<boolean> {
  const tesseract = providerStatuses.get('tesseract');
  return tesseract?.available ?? false;
}

/**
 * Check if search is available
 */
async function checkSearchCapability(): Promise<boolean> {
  // DuckDuckGo should always be available (no API key)
  const ddg = providerStatuses.get('duckduckgo');
  return ddg?.available ?? true; // Default true for DDG
}

/**
 * Check if time is available
 */
async function checkTimeCapability(): Promise<boolean> {
  // Time is always available (built-in Node.js)
  return true;
}

/**
 * Check if weather is available
 */
async function checkWeatherCapability(): Promise<boolean> {
  // Weather should always be available (Open-Meteo, no API key)
  const weather = providerStatuses.get('open-meteo');
  return weather?.available ?? true; // Default true for Open-Meteo
}

/**
 * Check if image generation is available
 */
async function checkImageCapability(): Promise<boolean> {
  // Pollinations should always be available (no API key)
  const pollinations = providerStatuses.get('pollinations');
  return pollinations?.available ?? true; // Default true
}

/**
 * Check if TTS is available
 */
function checkTTSCapability(): boolean {
  // Browser Web Speech API - always available
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Check if STT is available
 */
function checkSTTCapability(): boolean {
  // Browser SpeechRecognition API
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Check if translation is available
 */
async function checkTranslationCapability(): Promise<boolean> {
  // Translation is part of chat capability
  return checkChatCapability();
}

/**
 * Get unavailable features (for user messaging)
 */
export async function getUnavailableFeatures(): Promise<string[]> {
  const capabilities = await getSystemCapabilities();
  const unavailable: string[] = [];
  
  if (!capabilities.chat) unavailable.push('Chat');
  if (!capabilities.vision) unavailable.push('Vision/Image Analysis');
  if (!capabilities.ocr) unavailable.push('OCR/Text Recognition');
  if (!capabilities.search) unavailable.push('Web Search');
  if (!capabilities.time) unavailable.push('Time');
  if (!capabilities.weather) unavailable.push('Weather');
  if (!capabilities.imageGeneration) unavailable.push('Image Generation');
  if (!capabilities.textToSpeech) unavailable.push('Text-to-Speech');
  if (!capabilities.speechToText) unavailable.push('Speech-to-Text');
  if (!capabilities.translation) unavailable.push('Translation');
  
  return unavailable;
}

/**
 * Get capability explanation for AI
 */
export async function getCapabilityExplanation(): Promise<string> {
  const capabilities = await getSystemCapabilities();
  const available: string[] = [];
  const unavailable: string[] = [];
  
  if (capabilities.chat) available.push('chat and conversation');
  else unavailable.push('chat');
  
  if (capabilities.vision) available.push('image analysis and vision');
  else unavailable.push('vision');
  
  if (capabilities.ocr) available.push('text recognition from images');
  else unavailable.push('OCR');
  
  if (capabilities.search) available.push('web search');
  else unavailable.push('search');
  
  if (capabilities.time) available.push('time and date');
  else unavailable.push('time');
  
  if (capabilities.weather) available.push('weather information');
  else unavailable.push('weather');
  
  if (capabilities.imageGeneration) available.push('image generation');
  else unavailable.push('image generation');
  
  if (capabilities.textToSpeech) available.push('text-to-speech');
  else unavailable.push('TTS');
  
  if (capabilities.speechToText) available.push('speech recognition');
  else unavailable.push('STT');
  
  if (capabilities.translation) available.push('translation');
  else unavailable.push('translation');
  
  let explanation = '';
  
  if (available.length > 0) {
    explanation += `I can help with: ${available.join(', ')}.`;
  }
  
  if (unavailable.length > 0) {
    explanation += ` Currently unavailable: ${unavailable.join(', ')}.`;
  }
  
  return explanation;
}

/**
 * Initialize default providers
 */
export function initializeDefaultProviders(): void {
  // FREE providers
  initializeProvider('ollama', 'Ollama', 'chat');
  initializeProvider('ollama-vision', 'Ollama Vision', 'vision');
  initializeProvider('tesseract', 'Tesseract OCR', 'ocr');
  initializeProvider('duckduckgo', 'DuckDuckGo', 'search');
  initializeProvider('open-meteo', 'Open-Meteo', 'weather');
  initializeProvider('nodejs-time', 'Node.js Time', 'time');
  initializeProvider('pollinations', 'Pollinations', 'image');
  
  // Fallback providers
  initializeProvider('groq', 'Groq', 'chat');
  initializeProvider('openrouter', 'OpenRouter', 'chat');
  initializeProvider('together', 'Together AI', 'chat');
  initializeProvider('deepseek', 'DeepSeek', 'chat');
}
