/**
 * African AI Voices System
 * Multilingual TTS with cultural voice personalities
 * Supports 8 distinct African voices with customizable parameters
 */

export type AIVoiceGender = 'male' | 'female';
export type AIVoicePersonality = 'professional' | 'friendly' | 'energetic' | 'calm' | 'expressive';
export type SpeakingSpeed = 0.75 | 0.85 | 1.0 | 1.15 | 1.25;

export interface AIVoiceProfile {
  id: string;
  name: string;
  gender: AIVoiceGender;
  ethnicity: string;
  description: string;
  language: string;
  personality: AIVoicePersonality;
  baseVoiceId: string;
  emotionalRange: string[];
  nativePronunciation: boolean;
  accentProfile: string;
}

export interface VoiceCustomization {
  voiceId: string;
  speed: SpeakingSpeed;
  pitch: number; // -20 to 20
  volume: number; // 0.5 to 2.0
  language: string;
  accent: string;
  emotion: string;
  tone: 'warm' | 'neutral' | 'professional' | 'casual' | 'enthusiastic';
}

export interface TTSRequest {
  text: string;
  voice: AIVoiceProfile;
  customization: VoiceCustomization;
  streaming?: boolean;
}

export interface TTSResponse {
  audioUrl: string;
  audioBase64?: string;
  duration: number;
  provider: string;
  voiceUsed: string;
}

/**
 * MALE VOICES
 */
export const MALE_VOICES: Record<string, AIVoiceProfile> = {
  nosa: {
    id: 'nosa',
    name: 'Nosa',
    gender: 'male',
    ethnicity: 'Nigerian Edo',
    description: 'Deep, calm, and intelligent Nigerian male voice with professional tone',
    language: 'en-NG',
    personality: 'professional',
    baseVoiceId: 'nosa-male-nigerian-01',
    emotionalRange: ['professional', 'thoughtful', 'confident', 'warm'],
    nativePronunciation: true,
    accentProfile: 'Nigerian English with Edo undertones'
  },
  jide: {
    id: 'jide',
    name: 'Jide',
    gender: 'male',
    ethnicity: 'Nigerian Yoruba',
    description: 'Energetic, youthful, and conversational Yoruba male voice',
    language: 'en-NG, yo-NG',
    personality: 'friendly',
    baseVoiceId: 'jide-male-yoruba-01',
    emotionalRange: ['energetic', 'friendly', 'passionate', 'playful'],
    nativePronunciation: true,
    accentProfile: 'Nigerian Yoruba English with natural lilt'
  },
  uchena: {
    id: 'uchena',
    name: 'Uchena',
    gender: 'male',
    ethnicity: 'Nigerian Igbo',
    description: 'Confident, warm, and expressive Igbo male voice',
    language: 'en-NG, ig-NG',
    personality: 'expressive',
    baseVoiceId: 'uchena-male-igbo-01',
    emotionalRange: ['confident', 'warm', 'expressive', 'encouraging'],
    nativePronunciation: true,
    accentProfile: 'Nigerian Igbo English with natural warmth'
  },
  farouk: {
    id: 'farouk',
    name: 'Farouk',
    gender: 'male',
    ethnicity: 'Nigerian Hausa',
    description: 'Smooth, calm, and respectful Hausa male voice',
    language: 'en-NG, ha-NG',
    personality: 'calm',
    baseVoiceId: 'farouk-male-hausa-01',
    emotionalRange: ['calm', 'respectful', 'wise', 'gentle'],
    nativePronunciation: true,
    accentProfile: 'Nigerian Hausa English with dignified tone'
  }
};

/**
 * FEMALE VOICES
 */
export const FEMALE_VOICES: Record<string, AIVoiceProfile> = {
  imade: {
    id: 'imade',
    name: 'Imade',
    gender: 'female',
    ethnicity: 'Nigerian Edo',
    description: 'Elegant, soft, and intelligent Edo female voice with conversational tone',
    language: 'en-NG',
    personality: 'professional',
    baseVoiceId: 'imade-female-edo-01',
    emotionalRange: ['elegant', 'intelligent', 'conversational', 'warm'],
    nativePronunciation: true,
    accentProfile: 'Nigerian Edo English with natural elegance'
  },
  abike: {
    id: 'abike',
    name: 'Abike',
    gender: 'female',
    ethnicity: 'Nigerian Yoruba',
    description: 'Warm, expressive, and friendly Yoruba female voice',
    language: 'en-NG, yo-NG',
    personality: 'friendly',
    baseVoiceId: 'abike-female-yoruba-01',
    emotionalRange: ['warm', 'expressive', 'friendly', 'joyful'],
    nativePronunciation: true,
    accentProfile: 'Nigerian Yoruba English with natural warmth'
  },
  ezuche: {
    id: 'ezuche',
    name: 'Ezu uche',
    gender: 'female',
    ethnicity: 'Nigerian Igbo',
    description: 'Confident, articulate, and emotionally adaptive Igbo female voice',
    language: 'en-NG, ig-NG',
    personality: 'expressive',
    baseVoiceId: 'ezuche-female-igbo-01',
    emotionalRange: ['confident', 'articulate', 'adaptive', 'empathetic'],
    nativePronunciation: true,
    accentProfile: 'Nigerian Igbo English with natural expressiveness'
  },
  hadizat: {
    id: 'hadizat',
    name: 'Hadizat',
    gender: 'female',
    ethnicity: 'Nigerian Hausa',
    description: 'Calm, graceful, and professional Hausa female voice',
    language: 'en-NG, ha-NG',
    personality: 'professional',
    baseVoiceId: 'hadizat-female-hausa-01',
    emotionalRange: ['calm', 'graceful', 'professional', 'wise'],
    nativePronunciation: true,
    accentProfile: 'Nigerian Hausa English with graceful tone'
  }
};

/**
 * All voices combined
 */
export const ALL_AI_VOICES = {
  ...MALE_VOICES,
  ...FEMALE_VOICES
};

/**
 * Get voices by gender
 */
export function getVoicesByGender(gender: AIVoiceGender): AIVoiceProfile[] {
  return gender === 'male' 
    ? Object.values(MALE_VOICES)
    : Object.values(FEMALE_VOICES);
}

/**
 * Get voice by ID
 */
export function getVoiceById(id: string): AIVoiceProfile | null {
  return ALL_AI_VOICES[id as keyof typeof ALL_AI_VOICES] || null;
}

/**
 * Default customization settings
 */
export function getDefaultCustomization(voiceId: string): VoiceCustomization {
  const voice = getVoiceById(voiceId);
  
  return {
    voiceId,
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
    language: voice?.language || 'en-NG',
    accent: voice?.accentProfile || 'Nigerian English',
    emotion: 'neutral',
    tone: voice?.personality === 'professional' ? 'professional' : 'warm'
  };
}

/**
 * Supported African Languages for Voice
 */
export const AFRICAN_LANGUAGES_VOICE = {
  'en-NG': { name: 'English (Nigeria)', label: 'English (Nigerian)' },
  'yo-NG': { name: 'Yoruba (Nigeria)', label: 'Yoruba' },
  'ig-NG': { name: 'Igbo (Nigeria)', label: 'Igbo' },
  'ha-NG': { name: 'Hausa (Nigeria)', label: 'Hausa' },
  'sw-KE': { name: 'Swahili (Kenya)', label: 'Swahili' },
  'zu-ZA': { name: 'Zulu (South Africa)', label: 'Zulu' },
  'am-ET': { name: 'Amharic (Ethiopia)', label: 'Amharic' },
  'tw-GH': { name: 'Twi (Ghana)', label: 'Twi' },
  'ff-SN': { name: 'Fulani (Senegal)', label: 'Fulani' },
  'wo-SN': { name: 'Wolof (Senegal)', label: 'Wolof' },
  'ar-EG': { name: 'Arabic (Egypt)', label: 'Arabic (Egyptian)' },
  'ar-NG': { name: 'Arabic (Nigeria)', label: 'Arabic (Nigerian)' }
};

/**
 * Speech Recognition Configuration
 */
export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidence: number; // 0.5-1.0
}

export function getSpeechRecognitionConfig(language: string): SpeechRecognitionConfig {
  return {
    language: language || 'en-NG',
    continuous: true, // Full duplex - continuous listening
    interimResults: true, // Show results as speaking
    maxAlternatives: 3,
    confidence: 0.7
  };
}

/**
 * Streaming Audio Configuration
 */
export interface StreamingAudioConfig {
  chunkSize: number;
  sampleRate: number;
  channelCount: number;
  lowLatency: boolean;
}

export function getStreamingAudioConfig(): StreamingAudioConfig {
  return {
    chunkSize: 4096,
    sampleRate: 24000, // Lower sample rate for low-latency
    channelCount: 1, // Mono
    lowLatency: true
  };
}

/**
 * Voice Personality Profiles
 */
export const VOICE_PERSONALITIES: Record<string, { description: string; characteristics: string[] }> = {
  professional: {
    description: 'Authoritative, clear, formal',
    characteristics: ['precise pronunciation', 'measured pace', 'professional tone']
  },
  friendly: {
    description: 'Warm, approachable, conversational',
    characteristics: ['natural rhythm', 'warm tone', 'friendly cadence']
  },
  energetic: {
    description: 'Dynamic, enthusiastic, engaging',
    characteristics: ['animated tone', 'varied pace', 'expressive delivery']
  },
  calm: {
    description: 'Soothing, relaxed, peaceful',
    characteristics: ['slow pace', 'gentle tone', 'reassuring delivery']
  },
  expressive: {
    description: 'Emotional, dramatic, engaging',
    characteristics: ['dynamic range', 'emotional depth', 'natural variation']
  }
};

/**
 * Interrupt handling for full-duplex conversation
 */
export interface InterruptionHandler {
  isUserSpeaking: boolean;
  shouldStopAI: boolean;
  pauseTime: number; // milliseconds to wait before resuming
}

export function handleInterruption(): InterruptionHandler {
  return {
    isUserSpeaking: false,
    shouldStopAI: true,
    pauseTime: 500 // Wait 500ms before resuming
  };
}
