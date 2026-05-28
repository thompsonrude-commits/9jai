/**
 * Client-Side African Voices Configuration
 * Defines 8 distinct AI voices with full customization
 */

export type AIVoiceGender = 'male' | 'female';
export type AIVoicePersonality = 'professional' | 'friendly' | 'energetic' | 'expressive' | 'calm';
export type SpeakingSpeed = 0.75 | 0.85 | 0.95 | 1.0 | 1.1 | 1.25;
export type VoiceTone = 'neutral' | 'warm' | 'formal' | 'casual' | 'inspiring';
export type VoiceEmotion = 'neutral' | 'happy' | 'serious' | 'curious' | 'encouraging';

export interface AIVoiceProfile {
  id: string;
  name: string;
  gender: AIVoiceGender;
  language: string;
  region: string;
  personality: AIVoicePersonality;
  description: string;
  nativeSpeaker: boolean;
}

export interface VoiceCustomization {
  speed: SpeakingSpeed;
  pitch: number; // -20 to +20
  tone: VoiceTone;
  emotion: VoiceEmotion;
  language: string;
  volume: number; // 0 to 1
}

// Define 8 African AI Voices
export const MALE_VOICES: AIVoiceProfile[] = [
  {
    id: 'nosa',
    name: 'Nosa',
    gender: 'male',
    language: 'Edo',
    region: 'Edo State, Nigeria',
    personality: 'professional',
    description: 'Professional and authoritative Edo speaker. Perfect for formal content and documentaries.',
    nativeSpeaker: true,
  },
  {
    id: 'jide',
    name: 'Jide',
    gender: 'male',
    language: 'Yoruba',
    region: 'Yoruba Land, Nigeria',
    personality: 'energetic',
    description: 'Energetic and dynamic Yoruba speaker. Great for music, entertainment and casual chat.',
    nativeSpeaker: true,
  },
  {
    id: 'uchena',
    name: 'Uchena',
    gender: 'male',
    language: 'Igbo',
    region: 'Igbo Land, Nigeria',
    personality: 'expressive',
    description: 'Expressive and warm Igbo speaker. Ideal for storytelling and emotional content.',
    nativeSpeaker: true,
  },
  {
    id: 'farouk',
    name: 'Farouk',
    gender: 'male',
    language: 'Hausa',
    region: 'Northern Nigeria',
    personality: 'calm',
    description: 'Calm and measured Hausa speaker. Perfect for meditation and educational content.',
    nativeSpeaker: true,
  },
  {
    id: 'abdul',
    name: 'Abdul',
    gender: 'male',
    language: 'Fulfulde',
    region: 'Northern Nigeria',
    personality: 'friendly',
    description: 'Friendly Fulfulde speaker with a warm, conversational tone for storytelling and community updates.',
    nativeSpeaker: true,
  },
  {
    id: 'emeka',
    name: 'Emeka',
    gender: 'male',
    language: 'Tiv',
    region: 'Benue State, Nigeria',
    personality: 'energetic',
    description: 'Energetic Tiv speaker tuned for engaging narratives and local news summaries.',
    nativeSpeaker: true,
  },
  {
    id: 'naji',
    name: 'Naji',
    gender: 'male',
    language: 'Kanuri',
    region: 'Borno State, Nigeria',
    personality: 'professional',
    description: 'Professional Kanuri speaker for clear explanations and educational content.',
    nativeSpeaker: true,
  },
];

export const FEMALE_VOICES: AIVoiceProfile[] = [
  {
    id: 'imade',
    name: 'Imade',
    gender: 'female',
    language: 'Edo',
    region: 'Edo State, Nigeria',
    personality: 'professional',
    description: 'Professional and clear Edo speaker. Excellent for corporate and formal presentations.',
    nativeSpeaker: true,
  },
  {
    id: 'abike',
    name: 'Abike',
    gender: 'female',
    language: 'Yoruba',
    region: 'Yoruba Land, Nigeria',
    personality: 'friendly',
    description: 'Friendly and welcoming Yoruba speaker. Great for customer service and tutorials.',
    nativeSpeaker: true,
  },
  {
    id: 'ezuche',
    name: 'Ezuche',
    gender: 'female',
    language: 'Igbo',
    region: 'Igbo Land, Nigeria',
    personality: 'expressive',
    description: 'Expressive and engaging Igbo speaker. Perfect for storytelling and presentations.',
    nativeSpeaker: true,
  },
  {
    id: 'hadizat',
    name: 'Hadizat',
    gender: 'female',
    language: 'Hausa',
    region: 'Northern Nigeria',
    personality: 'professional',
    description: 'Professional and articulate Hausa speaker. Ideal for formal and educational content.',
    nativeSpeaker: true,
  },
  {
    id: 'amaka',
    name: 'Amaka',
    gender: 'female',
    language: 'Igbo',
    region: 'Igbo Land, Nigeria',
    personality: 'friendly',
    description: 'Warm Igbo speaker for conversational and cultural explanations.',
    nativeSpeaker: true,
  },
  {
    id: 'ibukun',
    name: 'Ibukun',
    gender: 'female',
    language: 'Efik',
    region: 'Cross River State, Nigeria',
    personality: 'calm',
    description: 'Calm Efik speaker for storytelling and heritage content.',
    nativeSpeaker: true,
  },
  {
    id: 'sade',
    name: 'Sade',
    gender: 'female',
    language: 'Yoruba',
    region: 'Yoruba Land, Nigeria',
    personality: 'expressive',
    description: 'Expressive Yoruba speaker with a rich, emotional tone for narratives.',
    nativeSpeaker: true,
  },
];

export const ALL_AI_VOICES: Record<string, AIVoiceProfile> = {
  ...Object.fromEntries([...MALE_VOICES, ...FEMALE_VOICES].map(v => [v.id, v]))
};

export const AFRICAN_LANGUAGES_VOICE = [
  'Edo', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin English',
  'Fulani', 'Kanuri', 'Tiv', 'Efik', 'Ijaw',
  'Ibibio', 'Cameroon Pidgin', 'Swahili', 'Zulu', 'Sotho'
];

export const VOICE_PERSONALITIES: AIVoicePersonality[] = [
  'professional', 'friendly', 'energetic', 'expressive', 'calm'
];

// Helper functions
export function getDefaultCustomization(voiceId: string): VoiceCustomization {
  return {
    speed: 1.0,
    pitch: 0,
    tone: 'neutral',
    emotion: 'neutral',
    language: 'en-NG',
    volume: 1.0,
  };
}

export function getVoicesByGender(gender: AIVoiceGender): AIVoiceProfile[] {
  return gender === 'male' ? MALE_VOICES : FEMALE_VOICES;
}

export function getVoiceById(voiceId: string): AIVoiceProfile | undefined {
  return ALL_AI_VOICES[voiceId];
}
