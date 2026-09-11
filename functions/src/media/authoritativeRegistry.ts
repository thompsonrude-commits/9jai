import type { ProviderId } from '../types';

export type ProviderDefinition = {
  providerId: ProviderId;
  displayName: string;
  capability: 'CHAT' | 'IMAGE' | 'VISION' | 'OCR' | 'TTS' | 'SEARCH' | 'VIDEO' | 'LOCAL' | 'UTILITY' | 'ANALYSIS' | 'CREATIVE' | 'SPECIALIZED';
  secretName?: string;
  local?: boolean;
  models?: string[];
  routingPriority?: number; // lower is higher priority
  fallbackEligible?: boolean;
  adapterPath?: string;
};

export const PROVIDER_DEFINITIONS: ProviderDefinition[] = [
  { providerId: 'native-gpu', displayName: 'ComfyUI (native GPU)', capability: 'IMAGE', secretName: 'COMFYUI_ENDPOINT', local: true, models: ['comfyui'], routingPriority: 10, fallbackEligible: false, adapterPath: './comfyAdapter' },
  { providerId: 'grok', displayName: 'Grok (xAI)', capability: 'CHAT', secretName: 'GROK_KEY', local: false, models: ['grok-1'], routingPriority: 20, fallbackEligible: true, adapterPath: '../providers/grok' },
  { providerId: 'ollama', displayName: 'Ollama (self-hosted)', capability: 'CHAT', local: true, models: ['ollama-local'], routingPriority: 15, fallbackEligible: true, adapterPath: '../providers/ollama' },
  { providerId: 'groq', displayName: 'Groq', capability: 'CHAT', secretName: 'GROQ_KEY', local: false, models: ['groq-1'], routingPriority: 25, fallbackEligible: true, adapterPath: '../providers/groq' },
  { providerId: 'huggingface', displayName: 'HuggingFace', capability: 'CHAT', secretName: 'HF_KEY', local: false, models: ['hf-inference'], routingPriority: 30, fallbackEligible: true, adapterPath: '../providers/huggingface' },
  { providerId: 'gemini', displayName: 'Google Gemini', capability: 'IMAGE', secretName: 'GEMINI_KEY', local: false, models: ['gemini-2.0-flash-preview-image-generation'], routingPriority: 5, fallbackEligible: true, adapterPath: '../providers/gemini' },
  { providerId: 'openrouter', displayName: 'OpenRouter', capability: 'IMAGE', secretName: 'OPENROUTER_KEY', local: false, models: ['dalle-3'], routingPriority: 12, fallbackEligible: true, adapterPath: '../providers/openrouter' },
  { providerId: 'mistral', displayName: 'Mistral AI', capability: 'CHAT', secretName: 'MISTRAL_KEY', local: false, models: ['mistral-large'], routingPriority: 35, fallbackEligible: true, adapterPath: '../providers/mistral' },
  { providerId: 'together', displayName: 'Together AI', capability: 'CHAT', secretName: 'TOGETHER_KEY', local: false, models: ['together-1'], routingPriority: 40, fallbackEligible: true, adapterPath: '../providers/together' },
  { providerId: 'tavily', displayName: 'Tavily', capability: 'SEARCH', secretName: 'TAVILY_KEY', local: false, models: [], routingPriority: 50, fallbackEligible: false, adapterPath: '../providers/tavily' },
  { providerId: 'tesseract', displayName: 'Tesseract OCR', capability: 'OCR', local: true, models: [], routingPriority: 5, fallbackEligible: false, adapterPath: '../providers/tesseract' },
  { providerId: 'google-tts', displayName: 'Google TTS', capability: 'TTS', secretName: 'GOOGLE_TTS_KEY', local: false, models: [], routingPriority: 15, fallbackEligible: true, adapterPath: '../providers/googleTTS' },
  { providerId: 'ollama-vision', displayName: 'Ollama Vision', capability: 'VISION', local: true, models: ['llava'], routingPriority: 10, fallbackEligible: true, adapterPath: '../providers/ollamaVision' },
  { providerId: 'pollinations', displayName: 'Pollinations', capability: 'IMAGE', local: false, models: ['flux'], routingPriority: 99, fallbackEligible: true, adapterPath: '../providers/pollinations' },
  { providerId: 'deepseek', displayName: 'DeepSeek (disabled)', capability: 'SEARCH', secretName: 'DEEPSEEK_KEY', local: false, models: [], routingPriority: 999, fallbackEligible: false, adapterPath: '../providers/deepseek' },
  // Local mock provider for audio/media used for testing and offline deterministic generation
  { providerId: 'local-audio-mock', displayName: 'Local Audio Mock', capability: 'CREATIVE', local: true, models: ['mock-audio'], routingPriority: 200, fallbackEligible: true, adapterPath: './localAudioMock' },
];
