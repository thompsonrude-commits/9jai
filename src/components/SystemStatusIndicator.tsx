/**
 * SystemStatusIndicator - Shows current system health
 * 
 * Visual indicator of which AI features are currently available
 * Helps users understand what the system can do right now
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSystemCapabilities,
  getAllProviderStatuses,
  initializeDefaultProviders,
  type SystemCapabilities,
  type ProviderStatus,
} from '../lib/providerHealth';

export default function SystemStatusIndicator() {
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize providers on mount
    initializeDefaultProviders();
    loadStatus();

    // Refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const caps = await getSystemCapabilities();
      const provs = getAllProviderStatuses();
      setCapabilities(caps);
      setProviders(provs);
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!capabilities) return null;

  const total = Object.keys(capabilities).length;
  const available = Object.values(capabilities).filter(Boolean).length;
  const percentage = Math.round((available / total) * 100);

  const getStatusColor = () => {
    if (percentage === 100) return 'text-green-500';
    if (percentage >= 75) return 'text-yellow-500';
    if (percentage >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (percentage === 100) return <CheckCircle2 size={16} className="text-green-500" />;
    if (percentage >= 75) return <AlertCircle size={16} className="text-yellow-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  const getStatusText = () => {
    if (percentage === 100) return 'All Systems Operational';
    if (percentage >= 75) return 'Most Systems Operational';
    if (percentage >= 50) return 'Reduced Capability Mode';
    return 'Minimal Mode';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg border border-[#008751]/20 overflow-hidden"
      >
        {/* Compact status bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-[#008751]/5 transition-colors w-full"
        >
          <Activity size={16} className={getStatusColor()} />
          <span className="text-sm font-medium text-[#008751]">
            {available}/{total}
          </span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[#008751]/10"
            >
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Overall status */}
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-xs font-medium text-[#008751]">
                    {getStatusText()}
                  </span>
                </div>

                {/* Feature list */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#008751]/70 uppercase tracking-wide">
                    Features
                  </p>
                  
                  <FeatureItem
                    name="Chat"
                    available={capabilities.chat}
                    icon="💬"
                  />
                  <FeatureItem
                    name="Vision"
                    available={capabilities.vision}
                    icon="👁️"
                  />
                  <FeatureItem
                    name="OCR"
                    available={capabilities.ocr}
                    icon="📄"
                  />
                  <FeatureItem
                    name="Search"
                    available={capabilities.search}
                    icon="🔍"
                  />
                  <FeatureItem
                    name="Weather"
                    available={capabilities.weather}
                    icon="🌤️"
                  />
                  <FeatureItem
                    name="Time"
                    available={capabilities.time}
                    icon="🕐"
                  />
                  <FeatureItem
                    name="Images"
                    available={capabilities.imageGeneration}
                    icon="🎨"
                  />
                  <FeatureItem
                    name="TTS"
                    available={capabilities.textToSpeech}
                    icon="🔊"
                  />
                  <FeatureItem
                    name="STT"
                    available={capabilities.speechToText}
                    icon="🎤"
                  />
                </div>

                {/* Provider details */}
                {providers.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#008751]/10">
                    <p className="text-xs font-semibold text-[#008751]/70 uppercase tracking-wide">
                      Providers
                    </p>
                    
                    {providers
                      .filter(p => p.available || p.consecutiveFailures > 0)
                      .slice(0, 5) // Show top 5
                      .map(provider => (
                        <ProviderItem key={provider.id} provider={provider} />
                      ))}
                  </div>
                )}

                {/* Refresh button */}
                <button
                  onClick={loadStatus}
                  disabled={loading}
                  className="w-full py-1.5 text-xs font-medium text-[#008751] hover:bg-[#008751]/5 rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh Status'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function FeatureItem({
  name,
  available,
  icon,
}: {
  name: string;
  available: boolean;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-[#008751]/80">{name}</span>
      </span>
      {available ? (
        <CheckCircle2 size={14} className="text-green-500" />
      ) : (
        <XCircle size={14} className="text-red-400" />
      )}
    </div>
  );
}

function ProviderItem({ provider }: { provider: ProviderStatus }) {
  const getStatusDot = () => {
    if (provider.available) {
      return <div className="w-2 h-2 rounded-full bg-green-500" />;
    }
    if (provider.consecutiveFailures >= 3) {
      return <div className="w-2 h-2 rounded-full bg-red-500" />;
    }
    return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2">
        {getStatusDot()}
        <span className="text-[#008751]/70 truncate max-w-[120px]">
          {provider.name}
        </span>
      </span>
      {provider.responseTime && (
        <span className="text-[#008751]/50 text-[10px]">
          {provider.responseTime}ms
        </span>
      )}
    </div>
  );
}
