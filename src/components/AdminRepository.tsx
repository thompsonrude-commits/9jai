import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Database, Search, ChevronRight, Globe, Clock, User, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminRepository({ onSelectLanguage }: { onSelectLanguage: (name: string) => void }) {
  const [languages, setLanguages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'languages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLanguages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = languages.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-12 py-24">
      <header className="mb-12">
        <h2 className="text-4xl font-serif text-[#1A1A1A] mb-4">Linguistic Repository</h2>
        <p className="text-[#5A5A40]">Access and manage all materials gathered by the crawler. Click on a language to view its full dossier.</p>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1A1]" />
        <input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by language or region..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#5A5A40]">Loading repository...</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((lang) => (
            <motion.button
              key={lang.id}
              whileHover={{ x: 10 }}
              onClick={() => onSelectLanguage(lang.name)}
              className="flex items-center justify-between p-6 bg-white border border-[#E5E5E5] rounded-3xl text-left hover:border-[#5A5A40] transition-colors group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                  {lang.isRegional ? <Database className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                    {lang.name}
                    {lang.isRegional && <span className="text-[8px] px-2 py-0.5 bg-[#5A5A40] text-white rounded-full uppercase tracking-tighter">Regional</span>}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-[#A1A1A1] mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {lang.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(lang.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#A1A1A1] group-hover:text-[#5A5A40] transition-colors" />
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="p-20 text-center border-2 border-dashed border-[#E5E5E5] rounded-[40px] text-[#A1A1A1]">
              No matching records found in the repository.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

