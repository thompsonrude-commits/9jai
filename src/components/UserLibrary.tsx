import React, { useState, useEffect } from 'react';
import { Trash2, Download, Share2, Calendar, MessageSquare, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserSessions, deleteSession, exportSessionAsText } from '../lib/sessionManager';
import { User } from 'firebase/auth';

interface UserLibraryProps {
  user: User | null;
  onClose: () => void;
  onSelectSession?: (sessionId: string) => void;
}

export default function UserLibrary({ user, onClose, onSelectSession }: UserLibraryProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.uid) {
      const userSessions = getUserSessions(user.uid);
      setSessions(userSessions.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    }
  }, [user]);

  const filteredSessions = sessions.filter(session =>
    session.languageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (sessionId: string) => {
    if (user?.uid && window.confirm('Delete this session?')) {
      deleteSession(user.uid, sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const handleExport = (session: any) => {
    const text = exportSessionAsText(session);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `${session.languageName}-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const seconds = Math.round((endTime - startTime) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#008751] to-[#00A862]">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">My Library</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sessions List */}
          <div className="w-full md:w-2/5 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008751]"
              />
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center px-4">
                    {sessions.length === 0 ? 'No chat history yet' : 'No matching sessions'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredSessions.map((session) => (
                    <motion.button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      whileHover={{ scale: 1.02 }}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedSession?.id === session.id
                          ? 'bg-[#008751] text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="font-semibold text-sm truncate">{session.languageName}</p>
                      <p className="text-xs opacity-70 truncate">{session.title}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-60">
                        <MessageSquare size={12} />
                        <span>{session.messages?.length || 0} messages</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="hidden md:flex md:w-3/5 flex-col overflow-y-auto">
            {selectedSession ? (
              <div className="flex flex-col h-full">
                {/* Session Info */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedSession.languageName}</h3>
                  <p className="text-sm text-gray-600 mb-4">{selectedSession.title}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Messages</p>
                      <p className="text-2xl font-bold text-[#008751]">{selectedSession.messages?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedSession.createdAt)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(selectedSession)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm"
                    >
                      <Download size={16} />
                      Export
                    </button>
                    <button
                      onClick={() => handleDelete(selectedSession.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-sm"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedSession.messages?.map((msg: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-[#008751] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {formatDate(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Select a session to view details</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
