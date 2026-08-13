import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { stopSpeaking } from '../lib/voiceEngine';
import { speakNigerian, stopNigerianSpeech } from '../lib/nigerianVoice';

interface VoiceAssistantDropdownProps {
  onVoiceInput?: (text: string) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onAssistantChange?: (id: string) => void;
  assignedAssistantId?: string; // Auto-assigned by parent
}

// ── 8 Nigerian AI Assistants ───────────────────────────────────────────────
export const ASSISTANTS = [
  { id: 'nosa',    name: 'Nosa',    gender: 'male'   as const },
  { id: 'jide',    name: 'Jide',    gender: 'male'   as const },
  { id: 'uchena',  name: 'Uchena',  gender: 'male'   as const },
  { id: 'farouk',  name: 'Farouk',  gender: 'male'   as const },
  { id: 'adesuwa', name: 'Adesuwa', gender: 'female' as const },
  { id: 'abike',   name: 'Abike',   gender: 'female' as const },
  { id: 'ijeoma',  name: 'Ijeoma',  gender: 'female' as const },
  { id: 'hadizat', name: 'Hadizat', gender: 'female' as const },
];

// ── Nigerian name phonetic spellings for TTS ───────────────────────────────
// These are what gets SPOKEN — spelled to match Nigerian pronunciation,
// not American English. "I" in Nigerian names = "ee" sound.
const AGENT_PHONETIC: Record<string, string> = {
  nosa:    'Noh-sah',
  jide:    'Jee-deh',
  uchena:  'Oo-cheh-nah',
  farouk:  'Fah-rook',
  adesuwa: 'Ah-deh-soo-wah',
  abike:   'Ah-bee-keh',
  ijeoma:  'Ee-jeh-oh-mah',   // NOT "eye-jee-oh-mah"
  hadizat: 'Hah-dee-zaht',
};

// ── Assign agent per session — truly random, different every session ───────
function getSessionAgent(): typeof ASSISTANTS[0] {
  // Check if this session already has an agent assigned
  const stored = sessionStorage.getItem('9jai_agent');
  if (stored) {
    const found = ASSISTANTS.find(a => a.id === stored);
    if (found) return found;
  }
  // Assign a truly random agent — different every new session
  // Use crypto.getRandomValues for better randomness than Math.random()
  const randomByte = new Uint8Array(1);
  crypto.getRandomValues(randomByte);
  const idx   = randomByte[0] % ASSISTANTS.length;
  const agent = ASSISTANTS[idx];
  sessionStorage.setItem('9jai_agent', agent.id);
  return agent;
}

export default function VoiceAssistantDropdown({
  onVoiceInput,
  onSpeakerToggle,
  onAssistantChange,
  assignedAssistantId,
}: VoiceAssistantDropdownProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [currentAgent] = useState(() => {
    if (assignedAssistantId) {
      return ASSISTANTS.find(a => a.id === assignedAssistantId) || getSessionAgent();
    }
    return getSessionAgent();
  });
  const recognitionRef = useRef<any>(null);

  // Notify parent of assigned agent on mount
  useEffect(() => {
    onAssistantChange?.(currentAgent.id);
  }, [currentAgent.id, onAssistantChange]);

  // Preload TTS voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const stopMic = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleMic = useCallback(() => {
    if (isListening) { stopMic(); return; }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input requires Chrome or Edge browser.');
      return;
    }

    stopSpeaking();
    stopNigerianSpeech();
    setIsListening(true);
    setInterimText('');

    const recognition = new SpeechRecognition();
    // Use English (Nigeria) as primary — best for Pidgin + Nigerian accents
    // Falls back to en-US if en-NG not supported
    recognition.lang = 'en-NG';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3; // get multiple guesses for better Pidgin matching

    // Nigerian language code hints — helps the recognizer understand local words
    // Most browsers use the primary lang but this improves accuracy
    try {
      (recognition as any).serviceURI = undefined; // use default service
    } catch { /* ignore */ }

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // Try all alternatives — pick the one that looks most like Pidgin/Nigerian
        if (event.results[i].isFinal) {
          // Check all alternatives, prefer Nigerian/Pidgin-sounding text
          const alternatives: string[] = [];
          for (let j = 0; j < event.results[i].length; j++) {
            alternatives.push(event.results[i][j].transcript);
          }
          // Pick best match — prefer alternative with Nigerian words
          const nigerianWords = /\b(wetin|abeg|dey|oya|sabi|wahala|naija|pidgin|abi|nau|dem|una|waka|chop|pikin)\b/i;
          final = alternatives.find(a => nigerianWords.test(a)) || alternatives[0] || '';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final.trim()) {
        setInterimText('');
        setIsListening(false);
        recognitionRef.current = null;
        if (onVoiceInput) onVoiceInput(final.trim());
      } else if (interim) {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'language-not-supported') {
        // Retry with en-US — wider support, still works for Nigerian accent
        const retryRecognition = new SpeechRecognition();
        retryRecognition.lang = 'en-US';
        retryRecognition.continuous = false;
        retryRecognition.interimResults = true;
        retryRecognition.maxAlternatives = 1;
        retryRecognition.onresult = recognition.onresult;
        retryRecognition.onerror = () => { setIsListening(false); setInterimText(''); };
        retryRecognition.onend = () => { setIsListening(false); setInterimText(''); recognitionRef.current = null; };
        recognitionRef.current = retryRecognition;
        setIsListening(true);
        try { retryRecognition.start(); } catch { setIsListening(false); }
      } else if (event.error === 'no-speech') {
        setIsListening(false);
        setInterimText('No speech detected. Try again.');
        setTimeout(() => setInterimText(''), 2000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isListening, stopMic, onVoiceInput]);

  const toggleSpeaker = useCallback(() => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    onSpeakerToggle?.(next);
    if (!next) {
      stopSpeaking();
      stopNigerianSpeech();
    } else {
      // Greet user — use phonetic spelling so TTS pronounces name correctly
      const phonetic = AGENT_PHONETIC[currentAgent.id] || currentAgent.name;
      const greeting = `My Oga, I be ${phonetic}. Na my pleasure to meet you. Wetin you want make I do for you today?`;
      speakNigerian(greeting, currentAgent.id);
    }
  }, [isSpeakerOn, onSpeakerToggle, currentAgent]);

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      stopSpeaking();
      stopNigerianSpeech();
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* Interim speech text */}
      <AnimatePresence>
        {interimText && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-[#008751] bg-[#008751]/10 px-2 py-0.5 rounded-full max-w-[90px] truncate"
          >
            {interimText}
          </motion.span>
        )}
      </AnimatePresence>

      {/* MIC BUTTON */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={toggleMic}
        type="button"
        className={`shrink-0 p-2 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-400/50'
            : 'bg-gray-100 text-gray-500 hover:bg-[#008751]/10 hover:text-[#008751]'
        }`}
        title={isListening ? 'Listening… tap to stop' : 'Tap to speak'}
      >
        {isListening ? (
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
            <Mic size={18} />
          </motion.div>
        ) : (
          <Mic size={18} />
        )}
      </motion.button>

      {/* SPEAKER BUTTON */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={toggleSpeaker}
        type="button"
        className={`shrink-0 p-2 rounded-full transition-all ${
          isSpeakerOn
            ? 'bg-[#008751]/10 text-[#008751]'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title={
          isSpeakerOn
            ? `Speaker ON — ${currentAgent.name} (${currentAgent.gender}) is active`
            : 'Speaker OFF — tap to hear AI responses'
        }
      >
        {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </motion.button>
    </div>
  );
}
