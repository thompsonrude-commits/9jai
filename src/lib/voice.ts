import { generateEdoAudio } from './ai';

export interface VoicePersona {
  name: string;
  gender: 'male' | 'female';
  pitch: number;
  rate: number;
}

export const EDO_PERSONAS: VoicePersona[] = [
  { name: 'Osaro', gender: 'male', pitch: 0.9, rate: 0.95 },
  { name: 'Efosa', gender: 'male', pitch: 1.0, rate: 1.0 },
  { name: 'Edosa', gender: 'male', pitch: 0.85, rate: 0.9 },
  { name: 'Itohan', gender: 'female', pitch: 1.1, rate: 1.05 },
  { name: 'Adesuwa', gender: 'female', pitch: 1.2, rate: 0.95 },
  { name: 'Imose', gender: 'female', pitch: 1.05, rate: 1.0 },
];

/**
 * Pre-fetches voices to ensure they are available when needed.
 */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

/**
 * Applies Edo-specific phonetic rules to re-spell text so that standard
 * English TTS engines approximate the Benin accent.
 * Refined based on user feedback regarding local vowel resonance.
 */
function applyEdoPhonetics(text: string): string {
  let p = text.toLowerCase().trim();

  // 1. Exact phrase/word overrides for the requested accent stability
  const phrasalMap: Record<string, string> = {
    'u ru ese': 'ooroo eh-say',
    'uru ese': 'ooroo eh-say',
    'oba': 'orbar',
    'owa': 'oh wah',
    'kọyo': 'kaw-yaw',
    'ọmọ': 'ormor',
    'obokhian': 'oborkheearn',
    'obowie': 'oboweeyeh',
    'obavan': 'obahvahn',
    'obota': 'obortah',
    'okhiowie': 'okheoweeyeh',
    'igho': 'eegheeor',
    'ekpọghọ': 'ehkpogheeor',
    'ẹghẹ': 'ehgheeor'
  };

  // Check for whole phrases first
  for (const [key, val] of Object.entries(phrasalMap)) {
    if (p === key) return val;
    const reg = new RegExp(`\\b${key}\\b`, 'g');
    p = p.replace(reg, val);
  }

  // 2. Character-level mapping for staccato feel
  p = p.replace(/vbor/g, 'vor'); // handle already replaced or-suffix
  p = p.replace(/vbo/g, 'vor');
  p = p.replace(/vbọ/g, 'vor');
  p = p.replace(/vbe/g, 'veh');
  p = p.replace(/vbẹ/g, 'veh');
  p = p.replace(/vba/g, 'vah');
  p = p.replace(/gh/g, 'ghee'); 
  p = p.replace(/mw/g, 'wh'); 
  
  p = p.replace(/ie\b/g, 'eeyeh'); 
  p = p.replace(/ọ/g, 'or');
  p = p.replace(/ẹ/g, 'eh');
  p = p.replace(/u/g, 'oo');
  p = p.replace(/e\b/g, 'eh'); 
  p = p.replace(/a\b/g, 'ah');
  p = p.replace(/\ba/g, 'ah');

  // Rhythm: In local dialects, vowels are often crisp. 
  // We can't do perfect tones, but we can prevent the 'English slide'
  // by adding a tiny bit of repetition or markers if the browser supports it.
  
  return p;
}

export function speak(text: string, persona?: VoicePersona, isEdo: boolean = true) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Immediate stop and clear the queue
  window.speechSynthesis.cancel();

  // Short delay to allow the engine to settle before speaking again
  setTimeout(() => {
    const processedText = isEdo ? applyEdoPhonetics(text) : text;
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Use a slightly faster rate to keep it fluid
    if (persona) {
      utterance.pitch = persona.pitch;
      utterance.rate = Math.max(persona.rate, 0.9);
    }

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = 
      voices.find(v => v.lang.includes('en-NG')) || 
      voices.find(v => v.lang.includes('en-GB')) ||
      voices.find(v => v.lang.includes('en-IN')) ||
      voices.find(v => v.lang.includes('en-US'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, 10);
}

// Global cache of Edo translation word -> custom developer audio URL / base64 string
export const customAudioCache: Record<string, string> = {};

let audioContext: AudioContext | null = null;

export async function playEdoSpeech(text: string) {
  const normalized = text.toLowerCase().trim();
  if (customAudioCache[normalized]) {
    try {
      new Audio(customAudioCache[normalized]).play();
      return;
    } catch (err) {
      console.warn("Failed to play cached custom developer audio, falling back to TTS:", err);
    }
  }

  try {
    const base64Data = await generateEdoAudio(text);
    if (base64Data) {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }

      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // TTS returns raw PCM 16-bit mono at 24kHz
      const audioData = new Int16Array(bytes.buffer);
      const floatData = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
          floatData[i] = audioData[i] / 32768.0;
      }

      const buffer = audioContext.createBuffer(1, floatData.length, 24000);
      buffer.getChannelData(0).set(floatData);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      return; // Exit after successful custom TTS playback
    }
  } catch (error) {
    console.error("Playback of custom audio failed", error);
  }

  // Fallback to browser TTS if custom TTS is disabled/fails
  speak(text);
}

export interface SpeechRecognitionResult {
  promise: Promise<string>;
  stop: () => void;
}

export function recordSpeech(onStatusChange?: (status: 'listening' | 'processing' | 'done' | 'error') => void): SpeechRecognitionResult {
  if (typeof window === 'undefined' || (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window))) {
    return {
      promise: Promise.reject('Speech recognition not supported'),
      stop: () => {}
    };
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = 'en-US'; 
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false; // Ensure it stops after one phrase

  let resolved = false;
  let timeoutId: any = null;

  const promise = new Promise<string>((resolve, reject) => {
    // Safety timeout: 10 seconds max listening
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        recognition.abort();
        onStatusChange?.('error');
        reject('Timeout');
      }
    }, 10000);

    recognition.onstart = () => {
      onStatusChange?.('listening');
    };

    recognition.onresult = (event: any) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      onStatusChange?.('processing');
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      onStatusChange?.('error');
      reject(event.error);
    };

    recognition.onend = () => {
      onStatusChange?.('done');
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        reject('No speech detected');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        reject(e);
      }
    }
  });

  return {
    promise,
    stop: () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        recognition.abort(); // Use abort for immediate cutoff
        onStatusChange?.('done');
      }
    }
  };
}

export interface AudioRecordingResult {
  promise: Promise<{ blob: Blob, base64: string }>;
  stop: () => void;
}

export function recordAudioBlob(onStatusChange?: (status: 'listening' | 'processing' | 'done' | 'error') => void): AudioRecordingResult {
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let stream: MediaStream | null = null;
  let resolved = false;

  const promise = new Promise<{ blob: Blob, base64: string }>(async (resolve, reject) => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ blob: audioBlob, base64 });
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks to release the microphone
        stream?.getTracks().forEach(track => track.stop());
        onStatusChange?.('done');
      };

      mediaRecorder.start();
      onStatusChange?.('listening');
    } catch (error) {
      onStatusChange?.('error');
      reject(error);
    }
  });

  return {
    promise,
    stop: () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }
  };
}
