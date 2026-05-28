import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Image, Mic, Globe, BookOpen, Database, Play, MessageSquare } from 'lucide-react';
import ImageGenerator from './ImageGenerator';
import VoiceSettingsModal from './VoiceSettingsModal';
import AppHeader from './AppHeader';

const featuredTools = [
  { title: 'AI Image Studio', description: 'Generate logos, cultural posters, avatars and more.', icon: Image, route: '/utilities' },
  { title: 'AI Voice Assistant', description: 'Speech-to-text, text-to-speech and accent coaching.', icon: Mic, route: '/utilities' },
  { title: 'AI Translation Hub', description: 'Translate text and voice across African languages.', icon: Globe, route: '/utilities' },
  { title: 'AI Creator Studio', description: 'Create thumbnails, stories, and media assets fast.', icon: BookOpen, route: '/utilities' },
];

const utilityCards = [
  { title: 'Image Studio', subtitle: 'Create cultural art, avatars, thumbnails.', icon: Image },
  { title: 'Voice Lab', subtitle: 'Generate multilingual speech and pronunciation guides.', icon: Mic },
  { title: 'Translation Hub', subtitle: 'Translate across text, voice and captions.', icon: Globe },
  { title: 'Storytelling', subtitle: 'Write African stories, scripts and lessons.', icon: BookOpen },
  { title: 'Research Assistant', subtitle: 'Ask questions and retrieve smart answers.', icon: Sparkles },
  { title: 'Podcast Studio', subtitle: 'Plan and script audio shows quickly.', icon: Play },
  { title: 'Productivity Tools', subtitle: 'Generate documents, summaries and plans.', icon: Database },
  { title: 'Learning Assistant', subtitle: 'Build quizzes, lessons and practice exercises.', icon: MessageSquare },
];

export default function Utilities() {
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <AppHeader />
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008751]/10 text-[#008751] text-xs font-bold uppercase tracking-widest">
          <Sparkles size={14} /> AI Universe
        </div>
        <h1 className="mt-4 text-3xl font-serif text-[#1A1A1A]">Utilities</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">A futuristic AI ecosystem hub for language, voice, images, learning and creative tools.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
        {featuredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.title}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#008751]/10 text-[#008751] mb-4">
                <Icon size={20} />
              </div>
              <h2 className="text-lg font-semibold mb-2">{tool.title}</h2>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {utilityCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              whileHover={{ scale: 1.01 }}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#008751] font-bold">Featured</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#1A1A1A]">{card.title}</h3>
                </div>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#008751]/10 text-[#008751]">
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-sm text-gray-600">{card.subtitle}</p>
              {card.title === 'Image Studio' ? (
                <button
                  onClick={() => setShowImageStudio(true)}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[#008751] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00A862] transition-colors"
                >
                  Open Studio
                </button>
              ) : card.title === 'Voice Lab' ? (
                <button
                  onClick={() => setShowVoiceSettings(true)}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[#008751] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00A862] transition-colors"
                >
                  Voice Settings
                </button>
              ) : (
                <div className="mt-6 text-xs text-gray-500">Coming soon in the Utilities hub.</div>
              )}
            </motion.div>
          );
        })}
      </section>
      {showImageStudio && (
        <ImageGenerator
          onClose={() => setShowImageStudio(false)}
          initialPrompt="A futuristic African cultural poster blending tradition and technology"
        />
      )}
      {showVoiceSettings && (
        <VoiceSettingsModal onClose={() => setShowVoiceSettings(false)} />
      )}
    </div>
  );
}
