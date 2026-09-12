import React from 'react';
import { motion } from 'motion/react';

export type LogoState =
  | 'idle' | 'processing' | 'listening' | 'speaking'
  | 'success' | 'error' | 'startup' | 'vision'
  | 'ocr' | 'translation' | 'image' | 'video' | 'document';

interface NineJALogoProps {
  state?: LogoState;
  size?: number;
  className?: string;
}

/**
 * BLACK AI Logo - Circular design with tech accents
 * Modern dark theme with bright green highlights
 */
export default function NineJALogo({ state = 'idle', size = 200, className = '' }: NineJALogoProps) {
  const isActive = ['processing', 'listening', 'speaking', 'vision', 'ocr', 'image', 'video', 'document'].includes(state);
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer ring with pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-[#00ff88]/30"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: isActive ? 1.2 : 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute inset-[8%] rounded-full border-2 border-[#00ff88]/40"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: isActive ? 1 : 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      />
      
      {/* Inner ring */}
      <div className="absolute inset-[15%] rounded-full border-2 border-[#00ff88]/50" />
      
      {/* Main logo circle */}
      <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#000000] flex items-center justify-center">
        {/* Circuit pattern accent */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[30%] left-[20%] w-[60%] h-px bg-[#00ff88]" />
          <div className="absolute top-[50%] left-[20%] w-[60%] h-px bg-[#00ff88]" />
          <div className="absolute top-[70%] left-[20%] w-[60%] h-px bg-[#00ff88]" />
        </div>
        
        {/* BLACKAI text as one word with letter animation */}
        <div className="relative z-10">
          <motion.div 
            className="font-black text-[1.8em] leading-none tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {['B', 'L', 'A', 'C', 'K'].map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block text-white"
                animate={{
                  y: isActive ? [0, -4, 0] : 0,
                }}
                transition={{
                  duration: 0.6,
                  repeat: isActive ? Infinity : 0,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              >
                {letter}
              </motion.span>
            ))}
            {['A', 'I'].map((letter, i) => (
              <motion.span
                key={i + 5}
                className="inline-block text-[#00ff88]"
                animate={{
                  y: isActive ? [0, -4, 0] : 0,
                  textShadow: isActive ? [
                    '0 0 5px rgba(0, 255, 136, 0.5)',
                    '0 0 15px rgba(0, 255, 136, 0.8)',
                    '0 0 5px rgba(0, 255, 136, 0.5)',
                  ] : '0 0 0px rgba(0, 255, 136, 0)',
                }}
                transition={{
                  duration: 0.6,
                  repeat: isActive ? Infinity : 0,
                  delay: (i + 5) * 0.1,
                  ease: "easeInOut"
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Active state glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: '0 0 40px rgba(0, 255, 136, 0.4), 0 0 80px rgba(0, 255, 136, 0.2)',
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Network particles for active states */}
      {isActive && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-[#00ff88] rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, Math.cos((i / 6) * Math.PI * 2) * (size * 0.6)],
                y: [0, Math.sin((i / 6) * Math.PI * 2) * (size * 0.6)],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut"
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/**
 * Small logo for sidebar/header
 */
export function NineJALogoSmall({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-2 border-[#00ff88]/40" />
      <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#000000] flex items-center justify-center">
        <div className="relative z-10">
          <span className="text-white font-black text-[0.65em]">BLACK</span>
          <span className="text-[#00ff88] font-black text-[0.65em]">AI</span>
        </div>
      </div>
    </div>
  );
}
