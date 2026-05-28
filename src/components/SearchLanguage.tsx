import React, { useState } from 'react';
import { Search, MapPin, Sparkles, Loader2, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { discoverLanguage } from '../lib/ai';
import { db, auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export default function SearchLanguage({ onLanguageFound }: { onLanguageFound: (name: string) => void }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isRegional, setIsRegional] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;
    
    if (!auth.currentUser) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("Login failed", error);
        return;
      }
    }

    setIsSearching(true);
    try {
      // 1. Crawl for data via Gemini
      const report = await discoverLanguage(name, location, isRegional);
      
      // 2. Persist to Firestore
      const langRef = collection(db, 'languages');
      const q = query(langRef, where('name', '==', name));
      const existing = await getDocs(q);

      if (existing.empty) {
        await addDoc(langRef, {
          name,
          location,
          isRegional,
          lastSearchReport: report.text,
          sources: report.sources,
          createdAt: serverTimestamp(),
          discoveredBy: auth.currentUser?.uid
        });
      }

      onLanguageFound(name);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-24 px-12 pb-24">
      <header className="mb-16">
        <div className="flex items-center gap-2 mb-4">
          <button 
            type="button"
            onClick={() => setIsRegional(false)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${!isRegional ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#E5E5E5] text-[#5A5A40]'}`}
          >
            Singular Language
          </button>
          <button 
            type="button"
            onClick={() => setIsRegional(true)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${isRegional ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#E5E5E5] text-[#5A5A40]'}`}
          >
            Regional Batch
          </button>
        </div>
        <h2 className="text-5xl font-serif italic text-[#1A1A1A] mb-6 tracking-tight">
          {isRegional ? "Map Regional Heritage" : "Initiate Singular Training"}
        </h2>
        <p className="text-xl text-[#5A5A40] max-w-2xl leading-relaxed">
          {isRegional 
            ? "Input a geographical region (e.g. Niger Delta) and LinguistAI will identify all unique languages within its borders, sourcing foundational materials for each."
            : "Focus precisely on one language lineage. Provide its name and origin to begin deep material extraction."}
        </p>
      </header>

      <form onSubmit={handleSearch} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]">
              {isRegional ? "Region Name" : "Language Name"}
            </label>
            <div className="relative">
              {isRegional ? (
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1A1]" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1A1]" />
              )}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isRegional ? "e.g. Niger Delta" : "e.g. Edo"}
                className="w-full pl-12 pr-6 py-4 bg-white border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent transition-all"
                required
                disabled={isSearching}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]">General Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1A1]" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. South-South Nigeria"
                className="w-full pl-12 pr-6 py-4 bg-white border border-[#E5E5E5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent transition-all"
                required
                disabled={isSearching}
              />
            </div>
          </div>
        </div>

        <button
          disabled={isSearching}
          className="group relative w-full py-5 bg-[#5A5A40] text-white rounded-2xl font-medium overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100"
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            {isSearching ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{isRegional ? "Batch processing region..." : "Crawling archives & training AI..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{isRegional ? "Discover Region & Train AI" : "Discover Language & Train AI"}</span>
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-[#4A4A30] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </form>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-[#E5E5E5]">
        <FeatureCard 
          title="Batch Discovery" 
          desc="Perfect for regions with high linguistic density. Identify multiple languages in one sweep."
        />
        <FeatureCard 
          title="Internet Crawling" 
          desc="AI automatically sources dictionaries, grammar, and history from across the web."
        />
        <FeatureCard 
          title="Material Preservation" 
          desc="Every word found is stored in the cloud repository for researchers and future learners."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 rounded-3xl border border-[#E5E5E5] bg-white group hover:border-[#5A5A40] transition-colors">
      <h4 className="text-sm font-bold uppercase tracking-wider mb-2">{title}</h4>
      <p className="text-sm text-[#5A5A40] leading-relaxed">{desc}</p>
    </div>
  );
}
