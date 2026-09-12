import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, addDoc, onSnapshot, deleteDoc, doc,
  serverTimestamp, orderBy, query, updateDoc, where
} from "firebase/firestore";
import { db, uploadAudio } from "../lib/firebase";
import {
  Sparkles, Mic, Square, Upload, Trash2, Play,
  X, Plus, Volume2, Edit2, Save, ChevronDown, ChevronUp, Info, Users, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordAudioBlob } from "../lib/voice";
import { NIGERIAN_LANGUAGES } from "../lib/nigerianLanguages";

type TrainingType = "conversation" | "correction" | "vocabulary" | "grammar" | "culture" | "spelling" | "phonetics" | "terminology";

interface TrainingEntry {
  id: string;
  type: TrainingType;
  language: string;  // Language code (e.g., 'edo', 'yoruba')
  languageName: string;  // Display name (e.g., 'Edo', 'Yoruba')
  nativeText: string;  // Text in the local language
  englishText: string;  // English translation/meaning
  phonetics?: string;  // How to pronounce it (IPA or simple)
  context?: string;
  audioUrl?: string;
  correction?: string;  // What was wrong and what's correct
  createdAt: any;
}

const TYPE_LABELS: Record<TrainingType, { label: string; color: string; desc: string }> = {
  conversation: { label: "Conversation", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", desc: "Teach natural dialogue and responses" },
  correction:   { label: "Correction",   color: "bg-red-500/20 text-red-400 border-red-500/30",   desc: "Correct something the AI said wrong" },
  vocabulary:   { label: "Vocabulary",   color: "bg-green-500/20 text-green-400 border-green-500/30", desc: "Add a word or phrase with meaning" },
  grammar:      { label: "Grammar",      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", desc: "Teach a grammar rule or pattern" },
  culture:      { label: "Culture",      color: "bg-purple-500/20 text-purple-400 border-purple-500/30", desc: "Add cultural context or background" },
  spelling:     { label: "Spelling",     color: "bg-orange-500/20 text-orange-400 border-orange-500/30", desc: "Fix incorrect spelling of words" },
  phonetics:    { label: "Phonetics",    color: "bg-pink-500/20 text-pink-400 border-pink-500/30", desc: "Teach pronunciation and sound patterns" },
  terminology:  { label: "Terminology",  color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", desc: "Define specialized terms and concepts" },
};

// Build flat list of all languages
const ALL_LANGUAGES = NIGERIAN_LANGUAGES.flatMap(region => 
  region.languages.map(lang => ({ id: lang.id, name: lang.name }))
).sort((a, b) => a.name.localeCompare(b.name));

const INPUT_CLASS = "w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:border-[#5A5A40] transition-colors";

export default function AdminTraining() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<TrainingType | "all">("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "aiTraining"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => {
        const data = d.data();
        // Migrate old entries that only have edoText
        if (data.edoText && !data.nativeText) {
          return {
            id: d.id,
            ...data,
            nativeText: data.edoText,
            language: 'edo',
            languageName: 'Edo'
          } as TrainingEntry;
        }
        return { id: d.id, ...data } as TrainingEntry;
      }));
      setLoading(false);
    });
    return unsub;
  }, []);

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this training entry?")) return;
    await deleteDoc(doc(db, "aiTraining", id));
  };

  const filtered = entries.filter(e => {
    const matchesType = filter === "all" || e.type === filter;
    const matchesLang = languageFilter === "all" || e.language === languageFilter;
    return matchesType && matchesLang;
  });
  
  const counts = entries.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {} as Record<string, number>);
  const langCounts = entries.reduce((acc, e) => { acc[e.language] = (acc[e.language] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 text-white">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00ff88] rounded-2xl flex items-center justify-center">
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black">AI Training Studio</h1>
              <p className="text-xs text-white/40 uppercase tracking-widest">Train BLACK AI in all African languages</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/agents')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-bold hover:bg-blue-500/30 transition-all"
          >
            <Users size={16} />
            Manage Agents
          </button>
        </div>
        <div className="p-4 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-2xl text-sm text-white/80 leading-relaxed">
          <Info size={14} className="inline mr-2 text-[#00ff88]" />
          Train the AI in any Nigerian/African language. Add vocabulary, correct spellings, teach phonetics, fix grammar mistakes, and provide audio pronunciations.
        </div>
      </div>

      {/* Language Filter */}
      <div className="mb-6 p-4 bg-black/30 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Globe size={16} className="text-[#00ff88]" />
          <label className="text-sm font-bold text-white">Filter by Language</label>
        </div>
        <select 
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
        >
          <option value="all">All Languages ({entries.length} total entries)</option>
          {ALL_LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.name} {langCounts[lang.id] ? `(${langCounts[lang.id]})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {(Object.keys(TYPE_LABELS) as TrainingType[]).map(type => (
          <button key={type} onClick={() => setFilter(filter === type ? "all" : type)}
            className={"p-3 rounded-2xl border text-center transition-all " + (filter === type ? TYPE_LABELS[type].color : "bg-[#1A1A1A] border-[#2A2A2A] text-[#5A5A5A] hover:border-[#00ff88]/30")}>
            <div className="text-xl font-bold">{counts[type] || 0}</div>
            <div className="text-[9px] uppercase tracking-widest mt-0.5">{TYPE_LABELS[type].label}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/60">
          {filtered.length} {filter === "all" ? "total" : TYPE_LABELS[filter as TrainingType].label.toLowerCase()} entries
          {languageFilter !== "all" && ` in ${ALL_LANGUAGES.find(l => l.id === languageFilter)?.name}`}
        </p>
        <button onClick={() => setIsAdding(v => !v)}
          className={"flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all " + (isAdding ? "bg-[#2A2A2A] text-white/60" : "bg-[#00ff88] text-black hover:bg-[#00ff88]/90")}>
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Add Training Entry"}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <AddTrainingForm onDone={() => setIsAdding(false)} defaultLanguage={languageFilter !== "all" ? languageFilter : undefined} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-20 text-white/40">Loading training data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl text-white/30">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No entries yet. Add training data to improve the AI.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <TrainingCard key={entry.id} entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onDelete={() => deleteEntry(entry.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AudioRecorder({ onRecorded, existingUrl }: { onRecorded: (blob: Blob, url: string) => void; existingUrl?: string | null }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl ?? null);
  const recorderRef = useRef<{ stop: () => void } | null>(null);
  const timerRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreviewUrl(existingUrl ?? null); }, [existingUrl]);

  const start = async () => {
    setIsRecording(true); setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    const recorder = recordAudioBlob((s) => { if (s === "error" || s === "done") { setIsRecording(false); clearInterval(timerRef.current); } });
    recorderRef.current = recorder;
    const { blob } = await recorder.promise;
    setIsRecording(false); clearInterval(timerRef.current); recorderRef.current = null;
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    onRecorded(blob, url);
  };

  const stop = () => { recorderRef.current?.stop(); recorderRef.current = null; setIsRecording(false); clearInterval(timerRef.current); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    onRecorded(f, url);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={isRecording ? stop : start}
          className={"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all " + (isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[#5A5A40] text-white hover:bg-[#6A6A50]")}>
          {isRecording ? <Square size={10} fill="currentColor" /> : <Mic size={10} />}
          {isRecording ? "Stop (" + seconds + "s)" : "Record"}
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#2A2A2A] text-[#8A8A60] hover:bg-[#3A3A3A] transition-all">
          <Upload size={10} /> Upload
        </button>
        {previewUrl && (
          <>
            <button type="button" onClick={() => new Audio(previewUrl).play()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">
              <Play size={10} fill="currentColor" /> Preview
            </button>
            <button type="button" onClick={() => { setPreviewUrl(null); onRecorded(new Blob(), ""); }}
              className="p-1.5 text-[#3A3A3A] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
          </>
        )}
      </div>
      {isRecording && <p className="text-[9px] text-red-400 animate-pulse font-bold uppercase">Recording... press Stop when done</p>}
      {previewUrl && !isRecording && <p className="text-[9px] text-green-400 font-bold uppercase">Audio ready</p>}
    </div>
  );
}

function TrainingCard({ entry, expanded, onToggle, onDelete }: { entry: TrainingEntry; expanded: boolean; onToggle: () => void; onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNativeText, setEditNativeText] = useState(entry.nativeText);
  const [editEnglishText, setEditEnglishText] = useState(entry.englishText);
  const [editPhonetics, setEditPhonetics] = useState(entry.phonetics || "");
  const [editContext, setEditContext] = useState(entry.context || "");
  const [editCorrection, setEditCorrection] = useState(entry.correction || "");
  const [editAudioBlob, setEditAudioBlob] = useState<Blob | null>(null);
  const [editAudioUrl, setEditAudioUrl] = useState<string | null>(entry.audioUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const meta = TYPE_LABELS[entry.type];

  useEffect(() => {
    setEditNativeText(entry.nativeText); 
    setEditEnglishText(entry.englishText);
    setEditPhonetics(entry.phonetics || "");
    setEditContext(entry.context || ""); 
    setEditCorrection(entry.correction || "");
    setEditAudioUrl(entry.audioUrl ?? null); 
    setEditAudioBlob(null);
  }, [entry]);

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    if (!expanded) onToggle();
  };

  const saveEdits = async () => {
    if (!editNativeText.trim() || !editEnglishText.trim()) return;
    setIsSaving(true);
    try {
      let audioUrl: string | undefined = entry.audioUrl;
      if (editAudioBlob && editAudioBlob.size > 0) {
        audioUrl = await uploadAudio("training-audio/" + Date.now() + "-" + editNativeText.slice(0, 20) + ".webm", editAudioBlob);
      }
      const updateData: any = {
        nativeText: editNativeText.trim(), 
        englishText: editEnglishText.trim(), 
        phonetics: editPhonetics.trim() || null,
        updatedAt: serverTimestamp(),
        context: editContext.trim() || null, 
        correction: editCorrection.trim() || null,
      };
      if (audioUrl) updateData.audioUrl = audioUrl;
      await updateDoc(doc(db, "aiTraining", entry.id), updateData);
      setEditAudioBlob(null); setIsEditing(false);
    } catch (err) {
      alert("Failed to save: " + (err instanceof Error ? err.message : String(err)));
    } finally { setIsSaving(false); }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#00ff88]/20 transition-colors">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
        <span className={"text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 " + meta.color}>{meta.label}</span>
        <div className="text-[10px] px-2 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-full font-bold uppercase tracking-wider">
          {entry.languageName}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{entry.nativeText}</div>
          <div className="text-xs text-white/60 truncate">{entry.englishText}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {entry.audioUrl && (
            <button onClick={e => { e.stopPropagation(); new Audio(entry.audioUrl!).play(); }}
              className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Play audio"><Volume2 size={14} /></button>
          )}
          <button onClick={openEdit} className="p-1.5 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
          {expanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-5 border-t border-[#2A2A2A]">
              {isEditing ? (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 pb-1">
                    <Edit2 size={12} className="text-[#00ff88]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88]">Editing Entry — all fields replaceable</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-white/60 font-bold block mb-1">{entry.languageName} Text *</label>
                      <textarea value={editNativeText} onChange={e => setEditNativeText(e.target.value)} rows={3}
                        className={INPUT_CLASS + " resize-none"} placeholder={`Text in ${entry.languageName}`} />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-white/60 font-bold block mb-1">English Meaning *</label>
                      <textarea value={editEnglishText} onChange={e => setEditEnglishText(e.target.value)} rows={3}
                        className={INPUT_CLASS + " resize-none"} placeholder="English translation" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-white/60 font-bold block mb-1">Phonetics / Pronunciation</label>
                    <input value={editPhonetics} onChange={e => setEditPhonetics(e.target.value)} className={INPUT_CLASS} 
                      placeholder="How to pronounce (e.g., ko-yo, or IPA: /kɔjɔ/)" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-white/60 font-bold block mb-1">Context / Usage Note</label>
                    <input value={editContext} onChange={e => setEditContext(e.target.value)} className={INPUT_CLASS} placeholder="Optional usage context" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-red-400 font-bold block mb-1">Correction Note</label>
                    <input value={editCorrection} onChange={e => setEditCorrection(e.target.value)}
                      className={INPUT_CLASS + " border-red-500/20 focus:ring-red-500/40"} placeholder="What the AI said wrong and what it should say" />
                  </div>
                  <div className="p-3 bg-black/30 rounded-xl border border-white/10">
                    <label className="text-[9px] uppercase tracking-widest text-white/60 font-bold block mb-2">
                      Audio Pronunciation {entry.audioUrl ? "(replace existing)" : "(optional)"}
                    </label>
                    <AudioRecorder
                      existingUrl={editAudioUrl}
                      onRecorded={(blob, url) => { setEditAudioBlob(blob.size > 0 ? blob : null); setEditAudioUrl(url || null); }}
                    />
                    {!editAudioBlob && entry.audioUrl && <p className="text-[9px] text-blue-400 font-bold uppercase mt-1">Existing audio saved — record new to replace</p>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdits} disabled={isSaving || !editNativeText.trim() || !editEnglishText.trim()}
                      className="flex items-center gap-1.5 px-5 py-2 bg-[#00ff88] text-black rounded-xl text-sm font-bold hover:bg-[#00ff88]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-1 justify-center">
                      <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditAudioBlob(null); setEditAudioUrl(entry.audioUrl ?? null); }}
                      className="px-5 py-2 border border-white/20 text-white/60 rounded-xl text-sm font-bold hover:bg-white/5 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">{entry.languageName}</p>
                      <p className="text-base font-serif text-white">{entry.nativeText}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">English</p>
                      <p className="text-sm text-white/80">{entry.englishText}</p>
                    </div>
                  </div>
                  {entry.phonetics && (
                    <div className="p-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl">
                      <p className="text-[9px] uppercase tracking-widest text-[#00ff88] mb-1">Phonetics / Pronunciation</p>
                      <p className="text-sm text-white font-mono">{entry.phonetics}</p>
                    </div>
                  )}
                  {entry.context && <div><p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Context</p><p className="text-xs text-white/60">{entry.context}</p></div>}
                  {entry.correction && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-[9px] uppercase tracking-widest text-red-400 mb-1">Correction</p>
                      <p className="text-xs text-white/80">{entry.correction}</p>
                    </div>
                  )}
                  {entry.audioUrl && (
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <Volume2 size={16} className="text-blue-400 shrink-0" />
                      <div className="flex-1"><p className="text-[9px] uppercase tracking-widest text-blue-400">Audio Saved</p></div>
                      <button onClick={() => new Audio(entry.audioUrl!).play()}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/30 transition-colors flex items-center gap-1">
                        <Play size={12} fill="currentColor" /> Play
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddTrainingForm({ onDone, defaultLanguage }: { onDone: () => void; defaultLanguage?: string }) {
  const [type, setType] = useState<TrainingType>("vocabulary");
  const [language, setLanguage] = useState(defaultLanguage || "edo");
  const [nativeText, setNativeText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [phonetics, setPhonetics] = useState("");
  const [context, setContext] = useState("");
  const [correction, setCorrection] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedLanguage = ALL_LANGUAGES.find(l => l.id === language) || ALL_LANGUAGES[0];

  const handleSave = async () => {
    if (!nativeText.trim() || !englishText.trim()) return;
    setSaving(true);
    try {
      let audioUrl: string | undefined;
      if (audioBlob && audioBlob.size > 0) {
        audioUrl = await uploadAudio("training-audio/" + Date.now() + "-" + nativeText.slice(0, 20) + ".webm", audioBlob);
      }
      const entry: any = { 
        type, 
        language: selectedLanguage.id,
        languageName: selectedLanguage.name,
        nativeText: nativeText.trim(), 
        englishText: englishText.trim(), 
        phonetics: phonetics.trim() || null,
        createdAt: serverTimestamp() 
      };
      if (context.trim()) entry.context = context.trim();
      if (correction.trim()) entry.correction = correction.trim();
      if (audioUrl) entry.audioUrl = audioUrl;
      await addDoc(collection(db, "aiTraining"), entry);
      onDone();
    } catch (err) {
      alert("Failed to save: " + (err instanceof Error ? err.message : String(err)));
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#00ff88]/20 rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#00ff88] rounded-xl flex items-center justify-center"><Plus size={16} className="text-black" /></div>
        <h3 className="font-black text-lg">New Training Entry</h3>
      </div>

      {/* Language Selection */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2 block flex items-center gap-2">
          <Globe size={12} className="text-[#00ff88]" />
          Select Language *
        </label>
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
        >
          {ALL_LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>
        <p className="text-xs text-white/40 mt-2">Choose the African language you're training the AI on</p>
      </div>

      {/* Entry Type */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2 block">Entry Type</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as TrainingType[]).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={"px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all " + (type === t ? TYPE_LABELS[t].color : "bg-transparent border-[#2A2A2A] text-white/40 hover:border-[#00ff88]/30")}>
              {TYPE_LABELS[t].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/40 mt-2">{TYPE_LABELS[type].desc}</p>
      </div>

      {/* Text Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2 block">{selectedLanguage.name} Text *</label>
          <textarea value={nativeText} onChange={e => setNativeText(e.target.value)} rows={3}
            placeholder={type === "conversation" ? "e.g. Natural phrase in " + selectedLanguage.name : "e.g. Word or term in " + selectedLanguage.name}
            className={INPUT_CLASS + " resize-none"} />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2 block">English Meaning *</label>
          <textarea value={englishText} onChange={e => setEnglishText(e.target.value)} rows={3}
            placeholder={type === "conversation" ? "e.g. English translation" : "e.g. Definition or meaning"}
            className={INPUT_CLASS + " resize-none"} />
        </div>
      </div>

      {/* Phonetics */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2 block">
          Phonetics / How to Pronounce (optional)
        </label>
        <input value={phonetics} onChange={e => setPhonetics(e.target.value)} className={INPUT_CLASS} 
          placeholder="e.g., ko-yo  or  IPA: /kɔjɔ/  or  sounds like 'co-yo'" />
        <p className="text-xs text-white/40 mt-1">Help users learn how to say this word correctly</p>
      </div>

      {/* Context */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2 block">Context / Usage Note (optional)</label>
        <input value={context} onChange={e => setContext(e.target.value)} className={INPUT_CLASS} 
          placeholder="e.g. Used as a casual greeting between friends" />
      </div>

      {/* Correction (for correction type) */}
      {type === "correction" && (
        <div>
          <label className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-2 block">What the AI said wrong and what it should say</label>
          <input value={correction} onChange={e => setCorrection(e.target.value)}
            className={INPUT_CLASS + " border-red-500/30 focus:ring-red-500/50"} 
            placeholder='e.g. AI said "Koyo" but correct spelling is "Kòyó" with tone marks' />
        </div>
      )}

      {/* Audio */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-2 block">Audio Pronunciation (optional but highly recommended)</label>
        <AudioRecorder onRecorded={(blob) => setAudioBlob(blob.size > 0 ? blob : null)} />
        <p className="text-xs text-white/40 mt-2">Record native pronunciation to help the AI learn correct sounds</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
        <button type="button" onClick={onDone} className="px-5 py-2.5 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
        <button type="button" onClick={handleSave} disabled={!nativeText.trim() || !englishText.trim() || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#00ff88] text-black rounded-xl text-sm font-bold hover:bg-[#00ff88]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "Saving..." : <><Save size={14} /> Save Training Entry</>}
        </button>
      </div>
    </div>
  );
}
