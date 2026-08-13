/**
 * SystemStatusChecker - Real-time system health display
 * Shows backend status, function availability, and performance metrics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Activity, Zap } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'checking';
  responseTime?: number;
  lastChecked?: string;
}

export default function SystemStatusChecker() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Chat API', status: 'checking' },
    { name: 'Image Generation', status: 'checking' },
    { name: 'Video Processing', status: 'checking' },
    { name: 'Vision Analysis', status: 'checking' },
    { name: 'Web Search', status: 'checking' },
    { name: 'Voice Services', status: 'checking' },
  ]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const checkSystemHealth = async () => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      // Check main health endpoint
      const healthResponse = await fetch('/api/ai/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      const healthData = await healthResponse.json();
      const responseTime = Date.now() - startTime;
      setSystemHealth({ ...healthData, responseTime });

      // Map provider status to services
      const updatedServices: ServiceStatus[] = [
        {
          name: 'Chat API',
          status: healthData.providers?.groq?.status === 'healthy' ? 'operational' : 'degraded',
          responseTime: healthData.providers?.groq?.avgLatencyMs || responseTime,
          lastChecked: new Date().toLocaleTimeString(),
        },
        {
          name: 'Image Generation',
          status: healthResponse.ok ? 'operational' : 'down',
          responseTime: responseTime,
          lastChecked: new Date().toLocaleTimeString(),
        },
        {
          name: 'Video Processing',
          status: healthData.readiness?.status === 'ready' ? 'operational' : 'degraded',
          responseTime: responseTime,
          lastChecked: new Date().toLocaleTimeString(),
        },
        {
          name: 'Vision Analysis',
          status: healthResponse.ok ? 'operational' : 'down',
          responseTime: responseTime,
          lastChecked: new Date().toLocaleTimeString(),
        },
        {
          name: 'Web Search',
          status: healthData.providers?.tavily ? 'operational' : 'degraded',
          responseTime: responseTime,
          lastChecked: new Date().toLocaleTimeString(),
        },
        {
          name: 'Voice Services',
          status: healthResponse.ok ? 'operational' : 'down',
          responseTime: responseTime,
          lastChecked: new Date().toLocaleTimeString(),
        },
      ];

      setServices(updatedServices);
    } catch (error) {
      console.error('Health check failed:', error);
      setServices(services.map(s => ({ ...s, status: 'down', lastChecked: new Date().toLocaleTimeString() })));
    }

    setIsChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      checkSystemHealth();
    }
  }, [isOpen]);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-500 bg-green-500/10';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'down':
        return 'text-red-500 bg-red-500/10';
      case 'checking':
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const allOperational = services.every(s => s.status === 'operational');
  const anyDown = services.some(s => s.status === 'down');

  return (
    <>
      {/* Status Indicator Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-gray-900/90 backdrop-blur-sm border border-gray-700 shadow-lg hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Activity className="w-4 h-4 text-gray-400" />
        <div className={`w-2 h-2 rounded-full ${
          allOperational ? 'bg-green-500' :
          anyDown ? 'bg-red-500' :
          'bg-yellow-500'
        } animate-pulse`} />
        <span className="text-xs text-gray-400 font-medium">System Status</span>
      </motion.button>

      {/* Status Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 z-50 w-80 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#008751]" />
                <h3 className="text-sm font-bold text-white">System Status</h3>
              </div>
              <button
                onClick={() => checkSystemHealth()}
                disabled={isChecking}
                className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Loader2 className={`w-4 h-4 text-gray-400 ${isChecking ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Services List */}
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {services.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      {service.lastChecked && (
                        <p className="text-xs text-gray-500">Updated {service.lastChecked}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold px-2 py-1 rounded-lg ${getStatusColor(service.status)}`}>
                      {service.status.toUpperCase()}
                    </div>
                    {service.responseTime && (
                      <p className="text-xs text-gray-500 mt-1">{service.responseTime}ms</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* System Metrics */}
            {systemHealth && (
              <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">System Health</span>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#008751]" />
                    <span className="text-xs font-bold text-[#008751]">
                      {systemHealth.responseTime}ms
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: allOperational ? '100%' : anyDown ? '30%' : '60%' }}
                      className={`h-full rounded-full ${
                        allOperational ? 'bg-green-500' :
                        anyDown ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {allOperational ? '100%' : anyDown ? '30%' : '60%'}
                  </span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/30">
              <p className="text-xs text-gray-500 text-center">
                All systems: <span className={`font-bold ${
                  allOperational ? 'text-green-500' :
                  anyDown ? 'text-red-500' :
                  'text-yellow-500'
                }`}>
                  {allOperational ? 'Operational' : anyDown ? 'Issues Detected' : 'Partial Degradation'}
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
