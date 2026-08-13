/**
 * SpeechEngine.ts
 *
 * Text-to-speech (TTS) and speech-to-text (STT) engine. Prioritises African
 * language voice models. Supports streaming audio output for real-time
 * conversations and batch transcription for longer audio files.
 *
 * TODO Phase 3: Integrate ElevenLabs, Google TTS, and Azure Speech providers
 * TODO Phase 3: Train/fine-tune Edo language TTS voice model
 * TODO Phase 3: Add support for tonal language prosody (Yoruba, Igbo tones)
 */

import type { EngineOptions, SupportedLanguageCode } from '../../utils/types';

// ---------------------------------------------------------------------------
// TTS types
// ---------------------------------------------------------------------------

export interface TTSOptions extends EngineOptions {
  voice?: string;            // voice ID or name
  speed?: number;            // 0.5–2.0
  pitch?: number;            // -20 to +20 semitones
  outputFormat?: 'mp3' | 'wav' | 'ogg' | 'pcm';
  streaming?: boolean;       // stream audio chunks
  language?: SupportedLanguageCode;
}

export interface SynthesizedAudio {
  audio: Buffer | AsyncIterable<Buffer>; // Buffer for batch, iterable for streaming
  mimeType: string;
  durationMs?: number;
  provider: string;
  voiceId: string;
}

// ---------------------------------------------------------------------------
// STT types
// ---------------------------------------------------------------------------

export interface STTOptions extends EngineOptions {
  language?: SupportedLanguageCode;
  detectLanguage?: boolean;    // auto-detect if unknown
  punctuate?: boolean;
  timestamps?: boolean;        // word-level timestamps
  speakerDiarization?: boolean;
}

export interface TranscriptionResult {
  text: string;
  detectedLanguage?: SupportedLanguageCode;
  confidence: number;
  words?: Array<{ word: string; startMs: number; endMs: number; confidence: number }>;
  speakers?: Array<{ speakerId: string; segments: Array<{ startMs: number; endMs: number }> }>;
  provider: string;
}

// ---------------------------------------------------------------------------
// Available voice descriptor
// ---------------------------------------------------------------------------

export interface VoiceDescriptor {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  languages: SupportedLanguageCode[];
  isAfricanVoice: boolean;
  previewUrl?: string;
}

// ---------------------------------------------------------------------------
// Engine interface
// ---------------------------------------------------------------------------

export interface SpeechEngine {
  synthesize(text: string, options?: TTSOptions): Promise<SynthesizedAudio>;
  transcribe(audioInput: string | Buffer, options?: STTOptions): Promise<TranscriptionResult>;
  listVoices(language?: SupportedLanguageCode): Promise<VoiceDescriptor[]>;
}

export class DefaultSpeechEngine implements SpeechEngine {
  async synthesize(text: string): Promise<SynthesizedAudio> {
    return {
      audio: Buffer.from(text),
      mimeType: 'audio/wav',
      durationMs: 1200,
      provider: 'local-tts',
      voiceId: 'default-voice',
    };
  }

  async transcribe(audioInput: string | Buffer): Promise<TranscriptionResult> {
    const content = typeof audioInput === 'string' ? audioInput : audioInput.toString('utf8');
    return {
      text: content,
      detectedLanguage: 'en',
      confidence: 0.91,
      provider: 'local-stt',
    };
  }

  async listVoices(): Promise<VoiceDescriptor[]> {
    return [
      { id: 'voice-en', name: 'English', gender: 'neutral', languages: ['en'], isAfricanVoice: false },
      { id: 'voice-edo', name: 'Edo', gender: 'neutral', languages: ['edo' as SupportedLanguageCode], isAfricanVoice: true },
    ];
  }
}
