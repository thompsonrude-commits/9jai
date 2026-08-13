import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from 'firebase-functions/params';
import { getSecretValue } from './secretHelpers';

/**
 * Google Cloud Text-to-Speech — Nigerian English Voices
 * Free tier: 1 million characters/month (Standard), 4 million (WaveNet)
 * Nigerian voices: en-NG-Standard-A (female), en-NG-Standard-B (male)
 * WaveNet Nigerian: en-NG-Wavenet-A (female), en-NG-Wavenet-B (male)
 * Uses REST API directly (no @google-cloud/text-to-speech SDK needed)
 */

/**
 * Secret definition for the Google Cloud TTS API Key.
 * Ensure this is set in your Firebase project using: firebase functions:secrets:set GOOGLE_TTS_KEY
 */
export const GOOGLE_TTS_KEY = defineSecret('GOOGLE_TTS_KEY');

// ── Nigerian voice mapping per assistant ───────────────────────────────────

const ASSISTANT_VOICES: Record<string, { name: string; gender: 'MALE' | 'FEMALE'; speakingRate: number; pitch: number }> = {
  // Male assistants — en-NG-Wavenet-B (Nigerian male neural voice)
  nosa:    { name: 'en-NG-Wavenet-B', gender: 'MALE',   speakingRate: 0.92, pitch: -2.0 },
  jide:    { name: 'en-NG-Wavenet-B', gender: 'MALE',   speakingRate: 1.05, pitch: 0.0  },
  uchena:  { name: 'en-NG-Wavenet-B', gender: 'MALE',   speakingRate: 0.95, pitch: -3.0 },
  farouk:  { name: 'en-NG-Wavenet-B', gender: 'MALE',   speakingRate: 0.88, pitch: -4.0 },
  // Female assistants — en-NG-Wavenet-A (Nigerian female neural voice)
  adesuwa: { name: 'en-NG-Wavenet-A', gender: 'FEMALE', speakingRate: 0.95, pitch: 1.0  },
  abike:   { name: 'en-NG-Wavenet-A', gender: 'FEMALE', speakingRate: 1.0,  pitch: 2.0  },
  ijeoma:  { name: 'en-NG-Wavenet-A', gender: 'FEMALE', speakingRate: 1.05, pitch: 1.5  },
  hadizat: { name: 'en-NG-Wavenet-A', gender: 'FEMALE', speakingRate: 0.9,  pitch: 0.5  },
};

// Fallback to Standard voices if WaveNet quota exceeded
const STANDARD_VOICES: Record<string, string> = {
  male:   'en-NG-Standard-B',
  female: 'en-NG-Standard-A',
};

// ── Synthesize speech ──────────────────────────────────────────────────────

/**
 * Callable Function Wrapper for TTS
 */
export const aiSpeak = onCall({
  region: "us-central1",
  cors: true,
  maxInstances: 10,
  secrets: [GOOGLE_TTS_KEY],
}, async (request) => {
  const { text, assistantId = 'nosa' } = request.data;

  if (!text) {
    throw new HttpsError('invalid-argument', 'The function must be called with a "text" argument.');
  }

  try {
    const result = await synthesizeNigerianSpeech(text, assistantId);
    if (!result) throw new Error('Synthesis returned null');
    return result;
  } catch (error: any) {
    console.error('Google TTS Synthesis Error:', error);
    throw new HttpsError('internal', 'Failed to synthesize speech via Google Cloud TTS');
  }
});

export async function synthesizeNigerianSpeech(
  text: string,
  assistantId: string
): Promise<{ audioBase64: string; contentType: string } | null> {
  const key = getSecretValue('GOOGLE_TTS_KEY', GOOGLE_TTS_KEY);
  if (!key) return null;

  const voiceConfig = ASSISTANT_VOICES[assistantId] || ASSISTANT_VOICES.nosa;

  // Clean text — remove markdown, limit length
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'code block')
    .replace(/[*_#`~\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 500);

  if (!cleanText) return null;

  const requestBody = {
    input: { text: cleanText },
    voice: {
      languageCode: 'en-NG',
      name: voiceConfig.name,
      ssmlGender: voiceConfig.gender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceConfig.speakingRate,
      pitch: voiceConfig.pitch,
      volumeGainDb: 1.0,
      effectsProfileId: ['headphone-class-device'],
    },
  };

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      // If WaveNet quota exceeded, retry with Standard voice
      if (res.status === 429 || err.includes('quota')) {
        console.warn('[GoogleTTS] WaveNet quota exceeded, retrying with Standard voice');
        const standardVoice = voiceConfig.gender === 'MALE' ? STANDARD_VOICES.male : STANDARD_VOICES.female;
        const retryBody = {
          ...requestBody,
          voice: { ...requestBody.voice, name: standardVoice },
        };
        const retryRes = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryBody),
            signal: AbortSignal.timeout(10000),
          }
        );
        if (!retryRes.ok) return null;
        const retryData = await retryRes.json() as { audioContent: string };
        return { audioBase64: retryData.audioContent, contentType: 'audio/mp3' };
      }
      console.warn(`[GoogleTTS] Error ${res.status}: ${err.slice(0, 100)}`);
      return null;
    }

    const data = await res.json() as { audioContent: string };
    if (!data.audioContent) return null;

    console.log(`[GoogleTTS] Synthesized ${cleanText.length} chars for ${assistantId} (${voiceConfig.name})`);
    return { audioBase64: data.audioContent, contentType: 'audio/mp3' };

  } catch (err: any) {
    console.warn(`[GoogleTTS] Failed: ${err.message}`);
    return null;
  }
}
