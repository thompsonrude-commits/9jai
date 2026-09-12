import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface LogoIntroProps {
  logoUrl: string;
  onComplete: () => void;
  duration?: number; // milliseconds
}

/**
 * Animated Spinning Logo Intro
 * Displays transparent logo with cinematic spinning animation
 * Appears before any page content loads
 */
export default function LogoIntro({ logoUrl, onComplete, duration = 3000 }: LogoIntroProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-complete animation
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-gradient-to-br from-[#001a33] via-[#003d66] to-[#006699] flex items-center justify-center z-[9999] overflow-hidden"
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(0, 200, 255, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(0, 200, 255, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(0, 200, 255, 0.1) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      {/* Center logo with spinning animation */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Main spinning logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            ease: 'linear',
            repeat: Infinity,
          }}
          className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl"
        >
          {/* Glow effect layer */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(0, 200, 255, 0.3)',
                '0 0 40px rgba(0, 200, 255, 0.5)',
                '0 0 20px rgba(0, 200, 255, 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
          />

          {/* Logo image */}
          <motion.img
            src={logoUrl}
            alt="BLACK AI Logo"
            className="w-full h-full object-contain filter drop-shadow-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            onError={() => {
              console.error('[LogoIntro] Failed to load logo');
              setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
          />
        </motion.div>

        {/* Animated ring around logo */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 4,
            ease: 'linear',
            repeat: Infinity,
          }}
          className="absolute w-40 h-40 md:w-48 md:h-48 border-2 border-transparent border-t-cyan-400 border-r-cyan-400 rounded-full"
        />

        {/* Loading text with animation */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-4 text-center"
        >
          <p className="text-white/60 text-sm md:text-base font-light tracking-widest uppercase">
            Loading...
          </p>
        </motion.div>
      </div>

      {/* Particle effects (optional) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: Math.cos((i / 5) * Math.PI * 2) * 200,
            y: Math.sin((i / 5) * Math.PI * 2) * 200,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full"
        />
      ))}
    </motion.div>
  );
}
