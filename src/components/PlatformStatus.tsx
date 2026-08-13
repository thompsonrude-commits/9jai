/**
 * Platform Status Component — Shows real-time platform diagnostics
 * Displays provider health, recovery queue status, and knowledge engine stats
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Database, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getPlatformDiagnostics, providerRegistry, recoveryService } from '../lib/platform';

export function PlatformStatus() {
  const [diagnostics, setDiagnostics] = useState(getPlatformDiagnostics());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDiagnostics(getPlatformDiagnostics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const allProviders = providerRegistry.getAllProviders();
  const allHealth = providerRegistry.getAllHealth();

  const overallHealth = diagnostics.providers.healthy / diagnostics.providers.total;
  const healthColor =
    overallHealth >= 0.8 ? 'text-green-500' :
    overallHealth >= 0.5 ? 'text-yellow-500' :
    'text-red-500';

  const healthBg =
    overallHealth >= 0.8 ? 'bg-green-500/10 border-green-500/30' :
    overallHealth >= 0.5 ? 'bg-yellow-500/10 border-yellow-500/30' :
    'bg-red-500/10 border-red-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      {/* Collapsed view */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${healthBg} border backdrop-blur-lg shadow-lg hover:scale-105 transition-transform`}
        >
          <Activity className={`w-4 h-4 ${healthColor}`} />
          <span className={`text-sm font-bold ${healthColor}`}>
            {diagnostics.providers.healthy}/{diagnostics.providers.total}
          </span>
          {diagnostics.recovery.queueLength > 0 && (
            <span className="ml-1 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {diagnostics.recovery.queueLength}
            </span>
          )}
        </button>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${healthColor}`} />
              <h3 className="text-white font-bold">Platform Status</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Provider Health */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-white">Providers</span>
            </div>
            <div className="space-y-2">
              {allProviders.map(provider => {
                const health = allHealth.find(h => h.providerId === provider.id);
                if (!health) return null;

                const statusColor =
                  health.status === 'healthy' ? 'text-green-500' :
                  health.status === 'degraded' ? 'text-yellow-500' :
                  'text-red-500';

                const statusIcon =
                  health.status === 'healthy' ? '●' :
                  health.status === 'degraded' ? '◐' :
                  '○';

                return (
                  <div key={provider.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={statusColor}>{statusIcon}</span>
                      <span className="text-gray-300">{provider.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      {health.averageLatency > 0 && (
                        <span>{Math.round(health.averageLatency)}ms</span>
                      )}
                      {health.successCount > 0 && (
                        <span>✓{health.successCount}</span>
                      )}
                      {health.failureCount > 0 && (
                        <span className="text-red-400">✗{health.failureCount}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recovery Queue */}
          {diagnostics.recovery.queueLength > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-white">Recovery Queue</span>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-yellow-200 mb-2">
                  <span>{diagnostics.recovery.queueLength} pending requests</span>
                  <button
                    onClick={() => recoveryService.retryAll()}
                    className="text-yellow-400 hover:text-yellow-300 underline"
                  >
                    Retry Now
                  </button>
                </div>
                {Object.entries(diagnostics.recovery.pendingByCapability).map(([cap, count]) => (
                  <div key={cap} className="flex items-center justify-between text-xs text-gray-400">
                    <span>{cap}</span>
                    <span>{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Engine */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-white">Knowledge Engine</span>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Total Entries</span>
                <span className="text-white font-bold">{diagnostics.knowledge.totalEntries}</span>
              </div>
              {Object.entries(diagnostics.knowledge.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between pl-4">
                  <span className="capitalize">{type}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Auto-updates every 5s</span>
              </div>
              <span className="text-green-400">● Live</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
