/**
 * HomePage - Landing page for BLACK AI
 * Clean welcome screen without sidebar
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, Sparkles, Globe, Zap, Shield, Users } from 'lucide-react';
import RotatingLogo from './RotatingLogo';

interface HomePageProps {
  user: any;
  isAdmin: boolean;
}

export default function HomePage({ user, isAdmin }: HomePageProps) {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Smart Conversations',
      description: 'AI-powered chat that understands context and provides intelligent responses'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'African Languages',
      description: 'Support for 500+ Nigerian and African languages with translation'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Powered by cutting-edge AI models for instant responses'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and protected'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-black flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <RotatingLogo size="large" />
          </div>

          {/* Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black mb-4"
          >
            <span className="text-white">BLACK</span>{' '}
            <span className="text-[#00ff88]">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-[#00ff88]/80 mb-2 font-semibold"
          >
            Africa's Smartest AI
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/60 max-w-2xl mx-auto mb-12"
          >
            Experience the power of AI built for Africa. Chat, translate, learn, and explore with cutting-edge technology.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/chat')}
              className="px-8 py-4 bg-[#00ff88] text-black font-bold rounded-xl hover:bg-[#00ff88]/90 transition-all transform hover:scale-105 shadow-lg shadow-[#00ff88]/20 flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Start Chatting
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Admin Dashboard
              </button>
            )}

            {!user && (
              <button
                onClick={() => navigate('/profile')}
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                Sign In
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + idx * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all hover:border-[#00ff88]/30"
            >
              <div className="text-[#00ff88] mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-[#00ff88]/10 to-transparent border border-[#00ff88]/20 rounded-2xl p-8 backdrop-blur-sm"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-[#00ff88] mb-2">500+</div>
              <div className="text-white/60 text-sm">Languages Supported</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#00ff88] mb-2">24/7</div>
              <div className="text-white/60 text-sm">Always Available</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#00ff88] mb-2">Fast</div>
              <div className="text-white/60 text-sm">Instant Responses</div>
            </div>
            <div>
              <div className="text-4xl font-black text-[#00ff88] mb-2">Free</div>
              <div className="text-white/60 text-sm">No Cost to Use</div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-12 text-white/40 text-sm"
        >
          <p>Powered by advanced AI technology • Built with ❤️ in Africa</p>
        </motion.div>
      </div>
    </div>
  );
}
