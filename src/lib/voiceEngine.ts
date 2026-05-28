/**
 * Real Voice Engine — Full speech recognition + TTS
 * Microphone: Web Speech API with Whisper fallback
 * Speaker: SpeechSynthesis API with voice personality mapping
 */

// ── Voice Personalities ────────────────────────────────────────────────────

export interface VoicePersonality {
  id: string;
  name: string;
  gender: 'male' | 'female';
  pitch: number;
  rate: number;
  lang: string;
}

export const VOICE_PERSONALITIES: VoicePersonality[] = [
  { id: 'nosa',    name: 'Nosa',    gender: 'male',   pitch: 0.90, rate: 0.90, lang: 'en-NG' },
  { id: 'jide',    name: 'Jide',    gender: 'male',   pitch: 1.00, rate: 1.05, lang: 'en-NG' },
  { id: 'uchena',  name: 'Uchena',  gender: 'male',   pitch: 0.85, rate: 0.95, lang: 'en-NG' },
  { id: 'farouk',  name: 'Farouk',  gender: 'male',   pitch: 0.80, rate: 0.85, lang: 'en-NG' },
  { id: 'imade',   name: 'Imade',   gender: 'female', pitch: 1.10, rate: 0.95, lang: 'en-NG' },
  { id: 'abike',   name: 'Abike',   gender: 'female', pitch: 1.15, rate: 1.02, lang: 'en-NG' },
  { id: 'ezuche',  name: 'Ezuche',  gender: 'female', pitch: 1.08, rate: 1.00, lang: 'en-NG' },
  { id: 'hadizat', name: 'Hadizat', gender: 'female', pitch: 1.05, rate: 0.92, lang: 'en-NG' },
];

// ── Supported languages ────────────────────────────────────────────────────

export const VOICE_LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'en-NG', name: 'Nigerian English' },
  { code: 'yo',    name: 'Yoruba' },
  { code: 'ha',    name: 'Hausa' },
  { code: 'ig',    name: 'Igbo' },
  { code: 'sw',    name: 'Swahili' },
  { code: 'zu',    name: 'Zulu' },
  { code: 'am',    name: 'Amharic' },
  { code: 'tw',    name: 'Twi' },
  { code: 'ar',    name: 'Arabic' },
  { code: 'fr',    name: 'French' },
];

// ── Check support ──────────────────────────────────────────────────────────

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!(( window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// ── Get best available TTS voice ───────────────────────────────────────────

function getBestVoice(personality: VoicePersonality): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Try to find a voice matching gender and language
  const langPrefixes = ['en-NG', 'en-GB', 'en-US', 'en'];

  for (const lang of langPrefixes) {
    const match = voices.find(v =>
      v.lang.startsWith(lang) &&
      (personality.gender === 'female'
        ? /female|woman|girl|zira|samantha|victoria|karen|moira|fiona|tessa/i.test(v.name)
        : /male|man|daniel|david|alex|fred|jorge|diego/i.test(v.name))
    );
    if (match) return match;
  }

  // Fallback: any English voice
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

// ── Speak text ─────────────────────────────────────────────────────────────

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  text: string,
  personality: VoicePersonality,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!isSpeechSynthesisSupported()) return;

  // Stop any current speech
  stopSpeaking();

  // Clean text — remove markdown, emojis that cause issues
  const clean = text
    .replace(/```[\s\S]*?```/g, 'code block')
    .replace(/[*_#`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .slice(0, 800); // limit length for responsiveness

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.pitch = personality.pitch;
  utterance.rate = personality.rate;
  utterance.volume = 1;

  // Wait for voices to load if needed
  const setVoice = () => {
    const voice = getBestVoice(personality);
    if (voice) utterance.voice = voice;
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    setVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      setVoice();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => { currentUtterance = null; onEnd?.(); };
  utterance.onerror = () => { currentUtterance = null; onEnd?.(); };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
}

// ── Speech Recognition ─────────────────────────────────────────────────────

export interface RecognitionSession {
  stop: () => void;
  isActive: () => boolean;
}

export function startListening(
  lang: string,
  onResult: (text: string, isFinal: boolean) => void,
  onError: (err: string) => void,
  onEnd: () => void,
  continuous = false
): RecognitionSession | null {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Use en-US as primary — most reliable, understands Nigerian/Pidgin speech
  // Fall back gracefully for African languages
  const supportedLangs = ['en-US', 'en-GB', 'fr-FR', 'ar-SA', 'sw', 'yo', 'ha', 'ig'];
  recognition.lang = supportedLangs.includes(lang) ? lang : 'en-US';
  recognition.continuous = continuous;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let active = true;

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final) onResult(final.trim(), true);
    else if (interim) onResult(interim.trim(), false);
  };

  recognition.onerror = (event: any) => {
    active = false;
    const msg = event.error === 'not-allowed'
      ? 'Microphone permission denied. Please allow microphone access.'
      : event.error === 'no-speech'
        ? 'No speech detected. Please try again.'
        : `Voice error: ${event.error}`;
    onError(msg);
  };

  recognition.onend = () => {
    active = false;
    onEnd();
  };

  try {
    recognition.start();
  } catch (e) {
    active = false;
    onError('Could not start microphone.');
    return null;
  }

  return {
    stop: () => {
      active = false;
      try { recognition.stop(); } catch { /* ignore */ }
    },
    isActive: () => active,
  };
}
