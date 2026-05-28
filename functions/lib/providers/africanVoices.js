"use strict";
/**
 * African AI Voices System
 * Multilingual TTS with cultural voice personalities
 * Supports 8 distinct African voices with customizable parameters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOICE_PERSONALITIES = exports.AFRICAN_LANGUAGES_VOICE = exports.ALL_AI_VOICES = exports.FEMALE_VOICES = exports.MALE_VOICES = void 0;
exports.getVoicesByGender = getVoicesByGender;
exports.getVoiceById = getVoiceById;
exports.getDefaultCustomization = getDefaultCustomization;
exports.getSpeechRecognitionConfig = getSpeechRecognitionConfig;
exports.getStreamingAudioConfig = getStreamingAudioConfig;
exports.handleInterruption = handleInterruption;
/**
 * MALE VOICES
 */
exports.MALE_VOICES = {
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
exports.FEMALE_VOICES = {
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
exports.ALL_AI_VOICES = {
    ...exports.MALE_VOICES,
    ...exports.FEMALE_VOICES
};
/**
 * Get voices by gender
 */
function getVoicesByGender(gender) {
    return gender === 'male'
        ? Object.values(exports.MALE_VOICES)
        : Object.values(exports.FEMALE_VOICES);
}
/**
 * Get voice by ID
 */
function getVoiceById(id) {
    return exports.ALL_AI_VOICES[id] || null;
}
/**
 * Default customization settings
 */
function getDefaultCustomization(voiceId) {
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
exports.AFRICAN_LANGUAGES_VOICE = {
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
function getSpeechRecognitionConfig(language) {
    return {
        language: language || 'en-NG',
        continuous: true, // Full duplex - continuous listening
        interimResults: true, // Show results as speaking
        maxAlternatives: 3,
        confidence: 0.7
    };
}
function getStreamingAudioConfig() {
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
exports.VOICE_PERSONALITIES = {
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
function handleInterruption() {
    return {
        isUserSpeaking: false,
        shouldStopAI: true,
        pauseTime: 500 // Wait 500ms before resuming
    };
}
//# sourceMappingURL=africanVoices.js.map