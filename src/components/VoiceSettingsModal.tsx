import React, { useState, useEffect } from 'react';
import { Volume2, Settings, X, Check, Play, Pause } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  MALE_VOICES, 
  FEMALE_VOICES,
  AFRICAN_LANGUAGES_VOICE,
  VOICE_PERSONALITIES,
  getDefaultCustomization,
  ALL_AI_VOICES,
  type AIVoiceProfile,
  type VoiceCustomization 
} from '../lib/voices';

interface VoiceSettingsModalProps {
  onClose: () => void;
}

/**
 * Voice Customization Settings
 * Full control over AI voice characteristics
 * Available in Utilities page
 */
export default function VoiceSettingsModal({ onClose }: VoiceSettingsModalProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState('nosa');
  const [customization, setCustomization] = useState<VoiceCustomization>(
    getDefaultCustomization('nosa')
  );
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');

  const selectedVoice = ALL_AI_VOICES[selectedVoiceId];
  const voices = voiceGender === 'male' ? MALE_VOICES : FEMALE_VOICES;

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('voice-preferences', JSON.stringify({
      voiceId: selectedVoiceId,
      customization
    }));
  }, [selectedVoiceId, customization]);

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setCustomization(getDefaultCustomization(voiceId));
  };

  const handlePreview = async () => {
    setIsPreviewPlaying(true);
    try {
      // Request preview audio from backend
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: selectedVoiceId,
          customization,
          text: `Hello, I'm ${selectedVoice.name}. This is how I sound.`
        })
      });

      if (response.ok) {
        const { audioUrl } = await response.json();
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPreviewPlaying(false);
        audio.play();
      }
    } catch (err) {
      console.error('Preview error:', err);
      setIsPreviewPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#008751] to-[#00A862] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Voice Gender
            </label>
            <div className="flex gap-4">
              {(['male', 'female'] as const).map(gender => (
                <motion.button
                  key={gender}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setVoiceGender(gender);
                    const firstVoiceId = Object.keys(gender === 'male' ? MALE_VOICES : FEMALE_VOICES)[0];
                    handleVoiceChange(firstVoiceId);
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    voiceGender === gender
                      ? 'bg-[#008751] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {gender === 'male' ? '👨 Male' : '👩 Female'}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Voice
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(voices).map(([id, voice]) => (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVoiceChange(id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedVoiceId === id
                      ? 'border-[#008751] bg-[#008751]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{voice.name}</div>
                  <div className="text-xs text-gray-600">{voice.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Voice Preview */}
          {selectedVoice && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{selectedVoice.name}</p>
                  <p className="text-sm text-gray-600 mb-2">{selectedVoice.description}</p>
                  <p className="text-xs text-gray-500">Region: {selectedVoice.region}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePreview}
                  className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                >
                  {isPreviewPlaying ? <Pause size={20} /> : <Play size={20} />}
                </motion.button>
              </div>
            </div>
          )}

          {/* Speaking Speed */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Speaking Speed: {(customization.speed * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min={0.75}
              max={1.25}
              step={0.05}
              value={customization.speed}
              onChange={(e) =>
                setCustomization(prev => ({ ...prev, speed: parseFloat(e.target.value) as any }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Slower (0.75x)</span>
              <span>Normal (1.0x)</span>
              <span>Faster (1.25x)</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Pitch: {customization.pitch > 0 ? '+' : ''}{customization.pitch}
            </label>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={customization.pitch}
              onChange={(e) =>
                setCustomization(prev => ({ ...prev, pitch: parseInt(e.target.value) }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Lower (-20)</span>
              <span>Normal (0)</span>
              <span>Higher (+20)</span>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Language
            </label>
            <select
              value={customization.language}
              onChange={(e) =>
                setCustomization(prev => ({ ...prev, language: e.target.value }))
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#008751]"
            >
              {AFRICAN_LANGUAGES_VOICE.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['warm', 'neutral', 'formal', 'casual', 'inspiring'] as const).map(tone => (
                <motion.button
                  key={tone}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCustomization(prev => ({ ...prev, tone }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    customization.tone === tone
                      ? 'bg-[#008751] text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tone}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Emotion */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Emotion
            </label>
            <select
              value={customization.emotion}
              onChange={(e) =>
                setCustomization(prev => ({ ...prev, emotion: e.target.value as VoiceCustomization['emotion'] }))
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#008751]"
            >
              <option value="neutral">Neutral</option>
              <option value="happy">Happy</option>
              <option value="serious">Serious</option>
              <option value="curious">Curious</option>
              <option value="encouraging">Encouraging</option>
            </select>
          </div>

          {/* Personality Info */}
          {selectedVoice && (
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Personality</p>
              <div className="space-y-1 text-sm text-gray-700">
                <p>{VOICE_PERSONALITIES[selectedVoice.personality]?.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VOICE_PERSONALITIES[selectedVoice.personality]?.characteristics.map((char, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-200 text-purple-900 text-xs rounded">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold text-gray-900 bg-gray-200 hover:bg-gray-300 transition-all"
          >
            Close
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold text-white bg-[#008751] hover:bg-[#006b41] transition-all flex items-center gap-2"
          >
            <Check size={20} />
            Save Settings
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
