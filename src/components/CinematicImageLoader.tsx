import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CinematicImageLoaderProps {
  prompt: string;
  progress: number;
  provider?: string;
}

const STAGES = [
  'Analyzing Visual Structure...',
  'Building Cinematic Composition...',
  'Simulating Lighting Physics...',
  'Rendering Depth of Field...',
  'Refining Anatomical Detail...',
  'Enhancing Textural Realism...',
  'Applying Cinematic Color Grade...',
  'Optimizing Visual Fidelity...',
  'Finalizing Cinematic Rendering...',
  'Upscaling to Maximum Resolution...',
];

export default function CinematicImageLoader({ prompt, progress, provider }: CinematicImageLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex(i => (i + 1) % STAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-gray-950 border border-[#008751]/30 shadow-2xl">
      <div className="relative h-40 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#000d05] to-black" />
        {[0,1,2,3,4].map(i => (
          <motion.div key={i} className="absolute h-px"
            style={{ top: `${15 + i * 18}%`, left: 0, right: 0, background: `linear-gradient(90deg, transparent, rgba(0,${135+i*20},${81+i*10},${0.3+i*0.1}), transparent)` }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: 'linear' }}
          />
        ))}
        {[0,1,2].map(i => (
          <motion.div key={i} className="absolute rounded-full border border-[#008751]/20"
            style={{ inset: `${20 + i*8}%` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <motion.div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-[#00A862]"
            style={{ left: `${5 + (i * 4.7) % 90}%`, top: `${10 + (i * 7.3) % 80}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 1.5 + (i % 4) * 0.3, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-full border border-[#008751]/40 flex items-center justify-center">
            <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-full border border-[#00A862]/60 flex items-center justify-center">
              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-[#008751]" />
            </motion.div>
          </motion.div>
        </div>
        <motion.div className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(0,135,81,0.04) 50%, transparent 60%)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="px-4 py-3 bg-gray-950">
        <AnimatePresence mode="wait">
          <motion.p key={stageIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}
            className="text-[#00A862] text-[11px] font-bold text-center mb-1.5 tracking-wide">
            {STAGES[stageIndex]}
          </motion.p>
        </AnimatePresence>
        <p className="text-gray-600 text-[9px] text-center truncate mb-2.5 italic">"{prompt.slice(0, 50)}{prompt.length > 50 ? '...' : ''}"</p>
        <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden mb-1.5">
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #008751, #00A862, #7FFF00, #00A862, #008751)', backgroundSize: '300% 100%' }}
            animate={{ width: `${Math.max(3, progress)}%`, backgroundPosition: ['0% 0%', '100% 0%'] }}
            transition={{ width: { duration: 0.6 }, backgroundPosition: { duration: 2, repeat: Infinity } }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[9px] text-gray-700">{provider || 'AI Visual Engine'}</span>
          <span className="text-[9px] text-[#008751] font-bold">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
