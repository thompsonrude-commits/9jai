import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Loader, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceConversationProps {
  onVoiceInput?: (text: string) => void;
  onSettingsOpen?: () => void;
}

interface VoiceState {
  isListening: boolean;
  isPlaying: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  volume: number;
}

/**
 * Real-Time Two-Way Voice Conversation
 * Minimal UI for homepage - just microphone and speaker toggles
 * Full controls available in Utilities page
 */
export default function VoiceConversation({ onVoiceInput, onSettingsOpen }: VoiceConversationProps) {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isPlaying: false,
    transcript: '',
    interim: '',
    error: null,
    volume: 1.0,
  });

  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeIntervalRef = useRef<number>();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: 'Speech recognition not available' }));
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Configuration for Nigerian accents
    recognition.lang = 'en-NG'; // Nigerian English
    recognition.continuous = true; // Full duplex - continuous listening
    recognition.interimResults = true; // Show results as user speaks
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        interim,
        transcript: (prev.transcript + final).trim(),
      }));

      // Send final results to parent
      if (final && onVoiceInput) {
        onVoiceInput(final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      setState(prev => ({
        ...prev,
        error: `Speech error: ${event.error}`,
        isListening: false,
      }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onVoiceInput]);

  // Monitor volume during playback
  useEffect(() => {
    if (state.isPlaying && audioRef.current) {
      volumeIntervalRef.current = window.setInterval(() => {
        if (audioRef.current) {
          const ctx = audioRef.current as any;
          // Get volume from audio element if available
          setState(prev => ({
            ...prev,
            volume: ctx.volume || 1.0,
          }));
        }
      }, 100);
    } else {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
    }

    return () => {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
    };
  }, [state.isPlaying]);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (state.isListening) {
      recognitionRef.current?.stop();
      setState(prev => ({ ...prev, isListening: false }));
    } else {
      // Check if user is interrupting AI speech
      if (state.isPlaying) {
        audioRef.current?.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      }
      
      recognitionRef.current?.start();
    }
  }, [state.isListening, state.isPlaying]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    if (audioRef.current) {
      audioRef.current.muted = !isSpeakerEnabled;
    }
  }, [isSpeakerEnabled]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* Voice animation indicator */}
      <AnimatePresence>
        {(state.isListening || state.isPlaying) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 bg-black/80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap"
          >
            {state.isListening && 'Listening...'}
            {state.isPlaying && 'Playing...'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microphone button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMicrophone}
        className={`p-4 rounded-full shadow-lg transition-all ${
          state.isListening
            ? 'bg-red-500 text-white'
            : 'bg-white text-gray-800 hover:bg-gray-100'
        }`}
        title={state.isListening ? 'Stop listening' : 'Start voice conversation'}
      >
        {state.isListening ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Mic size={24} />
          </motion.div>
        ) : (
          <Mic size={24} />
        )}
      </motion.button>

      {/* Speaker toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleSpeaker}
        className={`p-4 rounded-full shadow-lg transition-all ${
          isSpeakerEnabled
            ? 'bg-white text-gray-800 hover:bg-gray-100'
            : 'bg-gray-400 text-white'
        }`}
        title={isSpeakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
      >
        {isSpeakerEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </motion.button>

      {/* Settings (link to Utilities page) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSettingsOpen}
        className="p-4 rounded-full shadow-lg bg-white text-gray-800 hover:bg-gray-100 transition-all"
        title="Voice settings"
      >
        <Settings size={24} />
      </motion.button>

      {/* Audio element for TTS */}
      <audio ref={audioRef} className="hidden" />

      {/* Error indicator */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-32 right-6 bg-red-500 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2"
          >
            <AlertCircle size={16} />
            <span>{state.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume visualizer (when playing) */}
      <AnimatePresence>
        {state.isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-1 justify-center"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [4, 20, 4] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                className="w-1 bg-gradient-to-t from-cyan-400 to-cyan-600 rounded"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
