import React from 'react';
import { motion } from 'motion/react';

/**
 * Network wave background effect for 9JA AI
 * Adds subtle flowing waves and network patterns
 */
export default function NetworkBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {/* Flowing waves */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#008751" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Wave 1 */}
        <motion.path
          d="M0,100 Q250,80 500,100 T1000,100 T1500,100 T2000,100 V200 H0 Z"
          fill="url(#waveGradient)"
          initial={{ x: -500 }}
          animate={{ x: 0 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Wave 2 */}
        <motion.path
          d="M0,150 Q300,130 600,150 T1200,150 T1800,150 T2400,150 V250 H0 Z"
          fill="url(#waveGradient)"
          initial={{ x: -600 }}
          animate={{ x: 0 }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Wave 3 (bottom) */}
        <motion.path
          d="M0,300 Q350,280 700,300 T1400,300 T2100,300 T2800,300 V400 H0 Z"
          fill="url(#waveGradient)"
          initial={{ x: -700 }}
          animate={{ x: 0 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </svg>
      
      {/* Africa map dotted pattern (subtle) */}
      <div className="absolute right-0 top-1/4 w-1/3 h-1/2 opacity-20">
        <svg viewBox="0 0 200 300" className="w-full h-full" fill="none">
          {/* Simplified Africa continent made of dots */}
          {[...Array(150)].map((_, i) => {
            const x = 50 + Math.random() * 100;
            const y = 20 + Math.random() * 250;
            const isInside = (
              (x > 60 && x < 140 && y > 30 && y < 200) ||
              (x > 70 && x < 130 && y > 200 && y < 250)
            );
            
            if (!isInside) return null;
            
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="1.5"
                fill="#00ff88"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.02,
                  ease: "easeInOut"
                }}
              />
            );
          })}
        </svg>
      </div>
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#00ff88] rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Grid lines (subtle) */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ff88" strokeWidth="0.5" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
