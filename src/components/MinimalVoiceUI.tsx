import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { stopSpeaking } from '../lib/voiceEngine';

interface MinimalVoiceUIProps {
  onVoiceInput?: (text: string) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onSettingsOpen?: () => void;
}

export default function MinimalVoiceUI({ onVoiceInput, onSpeakerToggle }: MinimalVoiceUIProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  // Check support at runtime (not at module load time)
  const getMicSupport = () => !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  const getTTSSupport = () => 'speechSynthesis' in window;

  // Preload TTS voices
  useEffect(() => {
    if (getTTSSupport()) {
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
      alert('Voice input requires Chrome or Edge browser. Please open 9jai.web.app in Chrome.');
      return;
    }

    // Stop AI speech so mic can hear clearly
    stopSpeaking();
    setIsListening(true);
    setInterimText('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-NG'; // Nigerian English
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
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
        // Retry with en-US
        recognition.lang = 'en-US';
        try { recognition.start(); return; } catch { /* ignore */ }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isListening, stopMic, onVoiceInput]);

  const toggleSpeaker = useCallback(() => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    onSpeakerToggle?.(next);
    if (!next) stopSpeaking();
  }, [isSpeakerOn, onSpeakerToggle]);

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      stopSpeaking();
    };
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Live interim text */}
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

      {/* MIC BUTTON — always visible */}
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

      {/* SPEAKER BUTTON — always visible */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={toggleSpeaker}
        type="button"
        className={`shrink-0 p-2 rounded-full transition-all ${
          isSpeakerOn
            ? 'bg-[#008751]/10 text-[#008751]'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title={isSpeakerOn ? 'Speaker ON — tap to mute' : 'Speaker OFF — tap to hear AI'}
      >
        {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </motion.button>
    </div>
  );
}
