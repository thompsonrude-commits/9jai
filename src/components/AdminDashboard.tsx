/**
 * Admin Dashboard — Platform management and monitoring
 * Provides comprehensive view of system health, analytics, and controls
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Activity, Database, Users, Zap, TrendingUp, AlertCircle,
  CheckCircle, Clock, RefreshCw, BarChart3, Settings, Download
} from 'lucide-react';
import {
  getPlatformDiagnostics,
  providerRegistry,
  recoveryService,
  knowledgeEngine,
} from '../lib/platform';
import { platformAnalytics, getPerformanceMetrics, type PerformanceMetrics } from '../lib/platform/analytics';

interface AdminDashboardProps {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [diagnostics, setDiagnostics] = useState(getPlatformDiagnostics());
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'analytics' | 'knowledge'>('overview');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setDiagnostics(getPlatformDiagnostics());
    try {
      const perf = await getPerformanceMetrics();
      setMetrics(perf);
    } catch (err) {
      console.warn('[Admin] Failed to load metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const allProviders = providerRegistry.getAllProviders();
  const allHealth = providerRegistry.getAllHealth();

  async function handleManualRetry() {
    await recoveryService.retryAll();
    loadData();
  }

  function handleClearQueue() {
    recoveryService.clearQueue();
    loadData();
  }

  function handleClearKnowledge() {
    knowledgeEngine.clearCache();
    loadData();
  }

  async function handleFlushAnalytics() {
    await platformAnalytics.flush();
    loadData();
  }

  function exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      diagnostics,
      metrics,
      providers: allProviders.map(p => ({
        ...p,
        health: allHealth.find(h => h.providerId === p.id),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackai-platform-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-white/10 flex gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'providers', label: 'Providers', icon: Zap },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'knowledge', label: 'Knowledge', icon: Database },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <StatCard
                      icon={CheckCircle}
                      label="Healthy Providers"
                      value={`${diagnostics.providers.healthy}/${diagnostics.providers.total}`}
                      color="green"
                    />
                    <StatCard
                      icon={RefreshCw}
                      label="Queued Requests"
                      value={diagnostics.recovery.queueLength}
                      color="yellow"
                    />
                    <StatCard
                      icon={Database}
                      label="Knowledge Entries"
                      value={diagnostics.knowledge.totalEntries}
                      color="blue"
                    />
                    <StatCard
                      icon={TrendingUp}
                      label="Success Rate"
                      value={metrics ? `${(metrics.successRate * 100).toFixed(1)}%` : 'N/A'}
                      color={metrics && metrics.successRate >= 0.9 ? 'green' : 'yellow'}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-3">Quick Actions</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleManualRetry}
                        disabled={diagnostics.recovery.queueLength === 0}
                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium transition-colors"
                      >
                        Retry Queue
                      </button>
                      <button
                        onClick={handleClearQueue}
                        disabled={diagnostics.recovery.queueLength === 0}
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium transition-colors"
                      >
                        Clear Queue
                      </button>
                      <button
                        onClick={handleFlushAnalytics}
                        className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                      >
                        Flush Analytics
                      </button>
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-3">System Health</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average Latency</span>
                        <span className="text-white font-mono">
                          {metrics ? `${Math.round(metrics.averageLatency)}ms` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Requests (24h)</span>
                        <span className="text-white font-mono">
                          {metrics?.totalRequests ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Queue Retries</span>
                        <span className="text-white font-mono">
                          {diagnostics.recovery.totalRetries}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Providers Tab */}
              {activeTab === 'providers' && (
                <div className="space-y-4">
                  {allProviders.map(provider => {
                    const health = allHealth.find(h => h.providerId === provider.id);
                    if (!health) return null;

                    return (
                      <div key={provider.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              health.status === 'healthy' ? 'bg-green-500' :
                              health.status === 'degraded' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <h3 className="text-white font-bold">{provider.name}</h3>
                            <span className="text-xs text-gray-500">Priority: {provider.priority}</span>
                          </div>
                          <span className={`text-sm font-medium ${
                            provider.enabled ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {provider.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400 mb-1">Status</div>
                            <div className="text-white capitalize">{health.status}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Latency</div>
                            <div className="text-white">{Math.round(health.averageLatency)}ms</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Success / Fail</div>
                            <div className="text-white">
                              {health.successCount} / {health.failureCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Capabilities</div>
                            <div className="text-white text-xs">
                              {provider.capabilities.join(', ')}
                            </div>
                          </div>
                        </div>

                        {health.errorMessage && (
                          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                            {health.errorMessage}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && metrics && (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-3">Requests by Provider</h3>
                    <div className="space-y-2">
                      {Object.entries(metrics.requestsByProvider).map(([provider, count]) => (
                        <div key={provider} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 capitalize">{provider}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${(count / metrics.totalRequests) * 100}%` }}
                              />
                            </div>
                            <span className="text-white font-mono w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-3">Requests by Type</h3>
                    <div className="space-y-2">
                      {Object.entries(metrics.requestsByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 capitalize">{type}</span>
                          <span className="text-white font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {Object.keys(metrics.failureReasons).length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h3 className="text-red-400 font-bold mb-3">Failure Reasons</h3>
                      <div className="space-y-2">
                        {Object.entries(metrics.failureReasons).map(([reason, count]) => (
                          <div key={reason} className="flex items-center justify-between text-sm">
                            <span className="text-red-300">{reason}</span>
                            <span className="text-red-400 font-mono">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Knowledge Tab */}
              {activeTab === 'knowledge' && (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-bold">Knowledge Statistics</h3>
                      <button
                        onClick={handleClearKnowledge}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                      >
                        Clear Cache
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Entries</span>
                        <span className="text-white font-mono">
                          {diagnostics.knowledge.totalEntries}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-3">By Type</h3>
                    <div className="space-y-2">
                      {Object.entries(diagnostics.knowledge.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 capitalize">{type}</span>
                          <span className="text-white font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-3">By Language</h3>
                    <div className="space-y-2">
                      {Object.entries(diagnostics.knowledge.byLanguage).map(([lang, count]) => (
                        <div key={lang} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 uppercase">{lang}</span>
                          <span className="text-white font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'green' | 'yellow' | 'blue' | 'red';
}) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
