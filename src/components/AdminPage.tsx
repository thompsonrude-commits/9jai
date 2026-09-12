/**
 * AdminPage - Full admin interface for training AI and managing team
 * Accessible only to admin users
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Users, Database, BarChart3, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminTraining from './AdminTraining';
import TeamManagement from './TeamManagement';
import AdminRepository from './AdminRepository';
import { AdminDashboard } from './AdminDashboard';

type AdminTab = 'training' | 'team' | 'repository' | 'dashboard';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('training');
  const [showDashboard, setShowDashboard] = useState(false);

  const tabs = [
    { id: 'training' as AdminTab, label: 'AI Training', icon: GraduationCap, description: 'Train and improve the AI model' },
    { id: 'team' as AdminTab, label: 'Team Management', icon: Users, description: 'Manage team members who help train the AI' },
    { id: 'repository' as AdminTab, label: 'Language Repository', icon: Database, description: 'Manage language data and resources' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-[#00ff88]/20 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Back to Home</span>
              </button>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-[#00ff88]" />
                  <span>BLACK</span>
                  <span className="text-[#00ff88]">AI</span>
                  <span className="text-white/60 text-lg font-normal ml-2">Admin Panel</span>
                </h1>
                <p className="text-sm text-white/40 mt-1">Train the AI and manage your team</p>
              </div>
            </div>
            <button
              onClick={() => setShowDashboard(true)}
              className="px-4 py-2 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 text-[#00ff88] rounded-lg transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Platform Dashboard</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#00ff88]/10 text-[#00ff88] border-b-2 border-[#00ff88]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Description */}
      <div className="border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-white/60">
            {tabs.find(t => t.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'training' && <AdminTraining />}
            {activeTab === 'team' && <TeamManagement />}
            {activeTab === 'repository' && (
              <AdminRepository
                onSelectLanguage={(langName) => {
                  // Navigate to language page
                  const langId = langName.toLowerCase().replace(/\s+/g, '-');
                  navigate(`/language/${langId}`);
                }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Platform Dashboard Modal */}
      {showDashboard && (
        <AdminDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}
