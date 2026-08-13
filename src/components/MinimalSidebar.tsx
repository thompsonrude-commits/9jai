/**
 * MinimalSidebar — ChatGPT-style collapsible sidebar
 * 
 * Features:
 * - Collapsible (toggle button)
 * - Chat history with titles
 * - New chat button
 * - Session management
 * - Minimalist design
 * - Mobile responsive
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getUserSessions, deleteSession } from '../lib/sessionManager';
import { signOut } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface MinimalSidebarProps {
  user: FirebaseUser | null;
  currentSessionId?: string;
  onNewChat: () => void;
  onSelectSession?: (sessionId: string) => void;
  className?: string;
}

export default function MinimalSidebar({
  user,
  currentSessionId,
  onNewChat,
  onSelectSession,
  className = '',
}: MinimalSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [sessions, setSessions] = useState<SidebarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const navigate = useNavigate();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false); // Closed by default on mobile
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load chat sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userSessions = getUserSessions(user.uid).slice(-20).reverse().map((session) => ({
        id: session.id,
        title: session.title,
        lastMessage: session.messages[session.messages.length - 1]?.content || '',
        timestamp: session.updatedAt,
        messageCount: session.messages.length,
      })); // Last 20 sessions
      setSessions(userSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      deleteSession(user.uid, sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) {
      setIsOpen(false); // Auto-close on mobile after action
    }
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession?.(sessionId);
    if (isMobile) {
      setIsOpen(false); // Auto-close on mobile after action
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Truncate title
  const truncateTitle = (title: string, maxLength = 35): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${
          isOpen ? 'left-[260px]' : 'left-4'
        } top-4 z-50 p-2 rounded-lg bg-white border border-[#008751]/20 text-[#008751] hover:bg-[#008751]/5 transition-all shadow-sm md:left-4 md:${isOpen ? 'md:left-[260px]' : ''}`}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed left-0 top-0 h-full w-[260px] bg-white border-r border-[#008751]/20 flex flex-col z-40 ${className}`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#008751]/10">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#008751] text-white rounded-lg hover:bg-[#007041] transition-colors font-medium text-sm"
              >
                <Plus size={18} />
                New Chat
              </button>
            </div>

            {/* Chat history */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#008751] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare size={40} className="mx-auto text-[#008751]/30 mb-3" />
                  <p className="text-sm text-[#008751]/60">No chat history yet</p>
                  <p className="text-xs text-[#008751]/40 mt-1">Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <motion.button
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group relative ${
                        currentSessionId === session.id
                          ? 'bg-[#008751]/10 text-[#008751]'
                          : 'hover:bg-[#008751]/5 text-[#008751]/70'
                      }`}
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare 
                          size={16} 
                          className="mt-0.5 flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {truncateTitle(session.title)}
                          </p>
                          <p className="text-xs opacity-60 truncate mt-0.5">
                            {session.lastMessage}
                          </p>
                          <p className="text-[10px] opacity-40 mt-1">
                            {formatTimestamp(session.timestamp)} · {session.messageCount} msgs
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
                          aria-label="Delete chat"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {user && (
              <div className="p-4 border-t border-[#008751]/10">
                <button onClick={() => setShowAccount(value => !value)} className="w-full flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-[#008751]/10 flex items-center justify-center text-[#008751] font-semibold text-sm">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#008751] truncate">
                      {user.email || 'User'}
                    </p>
                    <p className="text-[10px] text-[#008751]/60">
                      {sessions.length} conversations
                    </p>
                  </div>
                </button>
                  {showAccount && (
                    <div className="mt-3 space-y-1 rounded-lg border border-[#008751]/15 bg-[#008751]/5 p-2">
                      <button onClick={() => navigate('/profile')} className="w-full rounded px-2 py-1.5 text-left text-xs text-[#008751] hover:bg-[#008751]/10">Account</button>
                      <button onClick={() => navigate('/utilities')} className="w-full rounded px-2 py-1.5 text-left text-xs text-[#008751] hover:bg-[#008751]/10">Settings</button>
                      <button onClick={() => signOut()} className="w-full rounded px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50">Log out</button>
                    </div>
                  )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
interface SidebarSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}
