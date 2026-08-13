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
 * 9JA AI Logo - Circular design with African continent
 * Matches the official design with network effects
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
      <div className="absolute inset-[15%] rounded-full border-2 border-[#008751]/50" />
      
      {/* Main logo circle */}
      <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-[#0a3d2a] to-[#051f16] flex items-center justify-center">
        {/* Africa continent shape (simplified) */}
        <svg
          viewBox="0 0 100 120"
          className="absolute w-[35%] h-[35%] opacity-30 fill-[#00ff88]"
          style={{ top: '25%' }}
        >
          <path d="M50,10 L55,15 L58,25 L60,35 L62,45 L63,55 L62,65 L60,75 L55,85 L50,95 L45,100 L40,105 L35,108 L30,108 L28,105 L27,100 L26,95 L25,85 L23,75 L22,65 L23,55 L25,45 L28,35 L32,25 L38,18 L45,12 Z" />
        </svg>
        
        {/* 9JA text */}
        <div className="relative z-10 text-center">
          <div className="text-white font-black text-[2.8em] leading-none tracking-tight">
            9<span className="text-[#00ff88]">JA</span>
          </div>
          <div className="text-[#00ff88] font-bold text-[0.9em] tracking-[0.2em] mt-[-0.2em]">
            AI
          </div>
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
      <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-[#0a3d2a] to-[#051f16] flex items-center justify-center">
        <svg
          viewBox="0 0 100 120"
          className="absolute w-[30%] h-[30%] opacity-20 fill-[#00ff88]"
          style={{ top: '22%' }}
        >
          <path d="M50,10 L55,15 L58,25 L60,35 L62,45 L63,55 L62,65 L60,75 L55,85 L50,95 L45,100 L40,105 L35,108 L30,108 L28,105 L27,100 L26,95 L25,85 L23,75 L22,65 L23,55 L25,45 L28,35 L32,25 L38,18 L45,12 Z" />
        </svg>
        <div className="relative z-10 text-center">
          <div className="text-white font-black text-[1.2em] leading-none">
            9<span className="text-[#00ff88]">JA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
