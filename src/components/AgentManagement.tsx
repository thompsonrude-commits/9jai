import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Mail,
  Lock,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Agent {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'trainer' | 'admin';
  permissions: string[];
  createdAt: any;
  createdBy: string;
}

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'agents'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAgents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agent)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent? They will lose access immediately.')) return;
    await deleteDoc(doc(db, 'agents', id));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-white">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif">Agent Management</h1>
            <p className="text-[10px] text-[#5A5A5A] uppercase tracking-widest">
              Create agents who can train and improve the AI
            </p>
          </div>
        </div>
        <div className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl text-sm text-[#8A8A60] leading-relaxed">
          <Shield size={14} className="inline mr-2 text-blue-400" />
          Agents can log in with their credentials and add training data to improve the AI's language understanding.
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#5A5A5A]">{agents.length} active agents</p>
        <button
          onClick={() => setIsAdding((v) => !v)}
          className={
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ' +
            (isAdding
              ? 'bg-[#2A2A2A] text-[#5A5A5A]'
              : 'bg-blue-500 text-white hover:bg-blue-600')
          }
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Cancel' : 'Create Agent'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <AddAgentForm onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-20 text-[#5A5A5A]">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#2A2A2A] rounded-3xl text-[#3A3A3A]">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No agents yet. Create your first training agent.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isEditing={editingId === agent.id}
              onEdit={() => setEditingId(agent.id)}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => deleteAgent(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddAgentForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'trainer' | 'admin'>('trainer');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'agents'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: role,
        permissions: role === 'admin' ? ['train', 'manage_agents', 'view_analytics'] : ['train'],
        createdAt: serverTimestamp(),
        createdBy: 'master_admin',
      });
      onDone();
    } catch (err) {
      alert('Failed to create agent: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const INPUT_CLASS =
    'w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-colors';

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Plus size={16} className="text-blue-400" />
        </div>
        <h3 className="font-serif text-lg">Create New Agent</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">
            Agent Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="e.g., John Doe"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">
            Email *
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3 text-[#5A5A5A]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS + ' pl-10'}
              placeholder="agent@example.com"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">
            Password *
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3 text-[#5A5A5A]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS + ' pl-10 pr-10'}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-[#5A5A5A] hover:text-white"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">
            Role *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'trainer' | 'admin')}
            className={INPUT_CLASS}
          >
            <option value="trainer">Trainer (Can train AI only)</option>
            <option value="admin">Admin (Can train + manage agents)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2A2A2A]">
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 text-sm text-[#5A5A5A] hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || !email.trim() || !password.trim() || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Creating...' : <><Save size={14} /> Create Agent</>}
        </button>
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  isEditing,
  onEdit,
  onCancelEdit,
  onDelete,
}: {
  agent: Agent;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const [editName, setEditName] = useState(agent.name);
  const [editEmail, setEditEmail] = useState(agent.email);
  const [editPassword, setEditPassword] = useState(agent.password);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveEdits = async () => {
    if (!editName.trim() || !editEmail.trim() || !editPassword.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'agents', agent.id), {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        password: editPassword.trim(),
      });
      onCancelEdit();
    } catch (err) {
      alert('Failed to update: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 hover:border-[#3A3A3A] transition-colors">
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-3 py-2 text-sm text-white"
              placeholder="Name"
            />
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-3 py-2 text-sm text-white"
              placeholder="Email"
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-3 py-2 pr-10 text-sm text-white"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-[#5A5A5A]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdits}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600"
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 border border-[#2A2A2A] text-[#5A5A5A] rounded-xl text-sm font-bold hover:bg-[#2A2A2A]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <UserCheck size={20} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">{agent.name}</h3>
            <p className="text-xs text-[#5A5A5A]">{agent.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={
                  'text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ' +
                  (agent.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-green-500/20 text-green-400')
                }
              >
                {agent.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-2 text-[#5A5A5A] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-[#3A3A3A] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
