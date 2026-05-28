import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Plus, Trash2, Key, User, ShieldAlert } from 'lucide-react';

interface Developer {
  id: string;
  username: string;
  createdAt?: any;
}

export default function TeamManagement() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'lexiconDevelopers'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const devs: Developer[] = [];
      snap.forEach((d) => devs.push({ id: d.id, ...d.data() } as Developer));
      setDevelopers(devs);
      setLoading(false);
    }, (err) => {
      console.error('Failed to fetch developers:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !pin.trim()) {
      setError('Username and PIN are required.');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 characters.');
      return;
    }
    
    const formattedUsername = username.trim().toLowerCase();
    
    try {
      const devRef = doc(db, 'lexiconDevelopers', formattedUsername);
      await setDoc(devRef, {
        username: formattedUsername,
        pin: pin,
        createdAt: serverTimestamp()
      });
      setUsername('');
      setPin('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      setError('Failed to create developer. Ensure your admin account has permission.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this developer?')) return;
    try {
      await deleteDoc(doc(db, 'lexiconDevelopers', id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete developer.');
    }
  };

  if (loading) return <div className="p-12 text-center text-[#5A5A40]">Loading team...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h2 className="text-4xl font-serif mb-2">Team Management</h2>
        <p className="text-[#5A5A40]">Create and manage Lexicon Developer accounts. Developers only have access to edit existing dictionary entries and upload audio.</p>
      </div>

      <div className="bg-[#1A1A1A] rounded-3xl p-8 border border-[#2A2A2A] mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><Users size={20} /> Active Developers</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#6A6A50] transition-colors"
          >
            {isAdding ? 'Cancel' : <><Plus size={16} /> Add Developer</>}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="bg-[#0F0F0F] p-6 rounded-2xl mb-6 border border-[#2A2A2A]">
            <h4 className="text-sm uppercase tracking-widest font-bold text-[#A1A1A1] mb-4">Create New Account</h4>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#5A5A5A] mb-1 uppercase tracking-widest">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., dev_mike"
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#5A5A40]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5A5A5A] mb-1 uppercase tracking-widest">Secret PIN</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A]" />
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#5A5A40]"
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs font-bold mb-4 flex items-center gap-1"><ShieldAlert size={12} /> {error}</p>}
            <button type="submit" className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#6A6A50] transition-colors">
              Save Developer
            </button>
          </form>
        )}

        <div className="space-y-3">
          {developers.length === 0 ? (
            <div className="text-center py-8 text-[#5A5A5A] border border-dashed border-[#2A2A2A] rounded-2xl">
              No developers have been created yet.
            </div>
          ) : (
            developers.map((dev) => (
              <div key={dev.id} className="flex items-center justify-between bg-[#0F0F0F] p-4 rounded-xl border border-[#2A2A2A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2A2A2A] rounded-full flex items-center justify-center text-[#A1A1A1]">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold">{dev.username}</p>
                    <p className="text-xs text-[#5A5A5A]">Lexicon Developer</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(dev.id)}
                  className="p-2 text-[#5A5A5A] hover:text-red-500 transition-colors"
                  title="Remove Developer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
