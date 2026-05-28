import React, { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, onSnapshot, deleteDoc, doc,
  serverTimestamp, orderBy, query, updateDoc
} from "firebase/firestore";
import { db, uploadAudio } from "../lib/firebase";
import {
  Sparkles, Mic, Square, Upload, Trash2, Play,
  X, Plus, Volume2, Edit2, Save, ChevronDown, ChevronUp, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { recordAudioBlob } from "../lib/voice";

type TrainingType = "conversation" | "correction" | "vocabulary" | "grammar" | "culture";

interface TrainingEntry {
  id: string;
  type: TrainingType;
  edoText: string;
  englishText: string;
  context?: string;
  audioUrl?: string;
  correction?: string;
  createdAt: any;
}

const TYPE_LABELS: Record<TrainingType, { label: string; color: string; desc: string }> = {
  conversation: { label: "Conversation", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", desc: "Teach natural Edo dialogue and responses" },
  correction:   { label: "Correction",   color: "bg-red-500/20 text-red-400 border-red-500/30",   desc: "Correct something the AI said wrong" },
  vocabulary:   { label: "Vocabulary",   color: "bg-green-500/20 text-green-400 border-green-500/30", desc: "Add a word or phrase with meaning" },
  grammar:      { label: "Grammar",      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", desc: "Teach a grammar rule or pattern" },
  culture:      { label: "Culture",      color: "bg-purple-500/20 text-purple-400 border-purple-500/30", desc: "Add cultural context or background" },
};

const INPUT_CLASS = "w-full bg-[#0F0F0F] border border-[#3A3A3A] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:border-[#5A5A40] transition-colors";

export default function AdminTraining() {
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<TrainingType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "aiTraining"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingEntry)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this training entry?")) return;
    await deleteDoc(doc(db, "aiTraining", id));
  };

  const filtered = filter === "all" ? entries : entries.filter(e => e.type === filter);
  const counts = entries.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-white">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-2xl flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-serif">AI Training Studio</h1>
            <p className="text-[10px] text-[#5A5A5A] uppercase tracking-widest">Teach Omwan Edo conversational skills</p>
          </div>
        </div>
        <div className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl text-sm text-[#8A8A60] leading-relaxed">
          <Info size={14} className="inline mr-2 text-[#5A5A40]" />
          Everything you add here is injected into the AI context on every conversation. Teach correct Edo phrases, fix mistakes, add grammar rules, and record audio pronunciations.
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
        {(Object.keys(TYPE_LABELS) as TrainingType[]).map(type => (
          <button key={type} onClick={() => setFilter(filter === type ? "all" : type)}
            className={"p-3 rounded-2xl border text-center transition-all " + (filter === type ? TYPE_LABELS[type].color : "bg-[#1A1A1A] border-[#2A2A2A] text-[#5A5A5A] hover:border-[#5A5A40]")}>
            <div className="text-xl font-bold">{counts[type] || 0}</div>
            <div className="text-[9px] uppercase tracking-widest mt-0.5">{TYPE_LABELS[type].label}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#5A5A5A]">{filtered.length} {filter === "all" ? "total" : TYPE_LABELS[filter as TrainingType].label.toLowerCase()} entries</p>
        <button onClick={() => setIsAdding(v => !v)}
          className={"flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all " + (isAdding ? "bg-[#2A2A2A] text-[#5A5A5A]" : "bg-[#5A5A40] text-white hover:bg-[#6A6A50]")}>
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel" : "Add Training Entry"}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <AddTrainingForm onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-20 text-[#5A5A5A]">Loading training data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#2A2A2A] rounded-3xl text-[#3A3A3A]">
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
  const [editEdo, setEditEdo] = useState(entry.edoText);
  const [editEng, setEditEng] = useState(entry.englishText);
  const [editContext, setEditContext] = useState(entry.context || "");
  const [editCorrection, setEditCorrection] = useState(entry.correction || "");
  const [editAudioBlob, setEditAudioBlob] = useState<Blob | null>(null);
  const [editAudioUrl, setEditAudioUrl] = useState<string | null>(entry.audioUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const meta = TYPE_LABELS[entry.type];

  useEffect(() => {
    setEditEdo(entry.edoText); setEditEng(entry.englishText);
    setEditContext(entry.context || ""); setEditCorrection(entry.correction || "");
    setEditAudioUrl(entry.audioUrl ?? null); setEditAudioBlob(null);
  }, [entry]);

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    if (!expanded) onToggle();
  };

  const saveEdits = async () => {
    if (!editEdo.trim() || !editEng.trim()) return;
    setIsSaving(true);
    try {
      let audioUrl: string | undefined = entry.audioUrl;
      if (editAudioBlob && editAudioBlob.size > 0) {
        audioUrl = await uploadAudio("training-audio/" + Date.now() + "-" + editEdo.slice(0, 20) + ".webm", editAudioBlob);
      }
      const updateData: any = {
        edoText: editEdo.trim(), englishText: editEng.trim(), updatedAt: serverTimestamp(),
        context: editContext.trim() || null, correction: editCorrection.trim() || null,
      };
      if (audioUrl) updateData.audioUrl = audioUrl;
      await updateDoc(doc(db, "aiTraining", entry.id), updateData);
      setEditAudioBlob(null); setIsEditing(false);
    } catch (err) {
      alert("Failed to save: " + (err instanceof Error ? err.message : String(err)));
    } finally { setIsSaving(false); }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#3A3A3A] transition-colors">
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
        <span className={"text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border shrink-0 " + meta.color}>{meta.label}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{entry.edoText}</div>
          <div className="text-xs text-[#5A5A5A] truncate">{entry.englishText}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {entry.audioUrl && (
            <button onClick={e => { e.stopPropagation(); new Audio(entry.audioUrl!).play(); }}
              className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Play audio"><Volume2 size={14} /></button>
          )}
          <button onClick={openEdit} className="p-1.5 text-[#5A5A5A] hover:text-[#8A8A60] hover:bg-[#2A2A2A] rounded-lg transition-colors" title="Edit"><Edit2 size={14} /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-[#3A3A3A] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
          {expanded ? <ChevronUp size={16} className="text-[#5A5A5A]" /> : <ChevronDown size={16} className="text-[#5A5A5A]" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-5 border-t border-[#2A2A2A]">
              {isEditing ? (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 pb-1">
                    <Edit2 size={12} className="text-[#5A5A40]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">Editing Entry — all fields replaceable</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#5A5A5A] font-bold block mb-1">Edo Text *</label>
                      <textarea value={editEdo} onChange={e => setEditEdo(e.target.value)} rows={3}
                        className={INPUT_CLASS + " resize-none"} placeholder="Edo phrase or word" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#5A5A5A] font-bold block mb-1">English Meaning *</label>
                      <textarea value={editEng} onChange={e => setEditEng(e.target.value)} rows={3}
                        className={INPUT_CLASS + " resize-none"} placeholder="English translation" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-[#5A5A5A] font-bold block mb-1">Context / Usage Note</label>
                    <input value={editContext} onChange={e => setEditContext(e.target.value)} className={INPUT_CLASS} placeholder="Optional usage context" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-red-400 font-bold block mb-1">Correction Note</label>
                    <input value={editCorrection} onChange={e => setEditCorrection(e.target.value)}
                      className={INPUT_CLASS + " border-red-500/20 focus:ring-red-500/40"} placeholder="What the AI said wrong and what it should say" />
                  </div>
                  <div className="p-3 bg-[#0F0F0F] rounded-xl border border-[#2A2A2A]">
                    <label className="text-[9px] uppercase tracking-widest text-[#5A5A5A] font-bold block mb-2">
                      Audio Pronunciation {entry.audioUrl ? "(replace existing)" : "(optional)"}
                    </label>
                    <AudioRecorder
                      existingUrl={editAudioUrl}
                      onRecorded={(blob, url) => { setEditAudioBlob(blob.size > 0 ? blob : null); setEditAudioUrl(url || null); }}
                    />
                    {!editAudioBlob && entry.audioUrl && <p className="text-[9px] text-blue-400 font-bold uppercase mt-1">Existing audio saved — record new to replace</p>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdits} disabled={isSaving || !editEdo.trim() || !editEng.trim()}
                      className="flex items-center gap-1.5 px-5 py-2 bg-[#5A5A40] text-white rounded-xl text-sm font-bold hover:bg-[#6A6A50] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-1 justify-center">
                      <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditAudioBlob(null); setEditAudioUrl(entry.audioUrl ?? null); }}
                      className="px-5 py-2 border border-[#2A2A2A] text-[#5A5A5A] rounded-xl text-sm font-bold hover:bg-[#2A2A2A] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><p className="text-[9px] uppercase tracking-widest text-[#5A5A5A] mb-1">Edo</p><p className="text-base font-serif text-white">{entry.edoText}</p></div>
                    <div><p className="text-[9px] uppercase tracking-widest text-[#5A5A5A] mb-1">English</p><p className="text-sm text-[#C9D1D9]">{entry.englishText}</p></div>
                  </div>
                  {entry.context && <div><p className="text-[9px] uppercase tracking-widest text-[#5A5A5A] mb-1">Context</p><p className="text-xs text-[#8A8A60]">{entry.context}</p></div>}
                  {entry.correction && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-[9px] uppercase tracking-widest text-red-400 mb-1">Correction</p>
                      <p className="text-xs text-[#C9D1D9]">{entry.correction}</p>
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

function AddTrainingForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState<TrainingType>("conversation");
  const [edoText, setEdoText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [context, setContext] = useState("");
  const [correction, setCorrection] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!edoText.trim() || !englishText.trim()) return;
    setSaving(true);
    try {
      let audioUrl: string | undefined;
      if (audioBlob && audioBlob.size > 0) {
        audioUrl = await uploadAudio("training-audio/" + Date.now() + "-" + edoText.slice(0, 20) + ".webm", audioBlob);
      }
      const entry: any = { type, edoText: edoText.trim(), englishText: englishText.trim(), createdAt: serverTimestamp() };
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
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#5A5A40] rounded-xl flex items-center justify-center"><Plus size={16} /></div>
        <h3 className="font-serif text-lg">New Training Entry</h3>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">Entry Type</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as TrainingType[]).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={"px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all " + (type === t ? TYPE_LABELS[t].color : "bg-transparent border-[#2A2A2A] text-[#5A5A5A] hover:border-[#5A5A40]")}>
              {TYPE_LABELS[t].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#3A3A3A] mt-2">{TYPE_LABELS[type].desc}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">Edo Text *</label>
          <textarea value={edoText} onChange={e => setEdoText(e.target.value)} rows={3}
            placeholder={type === "conversation" ? "e.g. Vbee oye he? — Oyese, uru ese." : "e.g. Koyo"}
            className={INPUT_CLASS + " resize-none"} />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">English Meaning *</label>
          <textarea value={englishText} onChange={e => setEnglishText(e.target.value)} rows={3}
            placeholder={type === "conversation" ? "e.g. How are you? — I am fine, thank you." : "e.g. Hello"}
            className={INPUT_CLASS + " resize-none"} />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">Context / Usage Note (optional)</label>
        <input value={context} onChange={e => setContext(e.target.value)} className={INPUT_CLASS} placeholder="e.g. Used as a casual greeting between friends" />
      </div>
      {type === "correction" && (
        <div>
          <label className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-2 block">What the AI said wrong and what it should say</label>
          <input value={correction} onChange={e => setCorrection(e.target.value)}
            className={INPUT_CLASS + " border-red-500/30 focus:ring-red-500/50"} placeholder='e.g. AI said "Koyo" but correct form is "Koyo" with dot under o' />
        </div>
      )}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#5A5A5A] font-bold mb-2 block">Audio Pronunciation (optional but recommended)</label>
        <AudioRecorder onRecorded={(blob) => setAudioBlob(blob.size > 0 ? blob : null)} />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2A2A2A]">
        <button type="button" onClick={onDone} className="px-5 py-2.5 text-sm text-[#5A5A5A] hover:text-white transition-colors">Cancel</button>
        <button type="button" onClick={handleSave} disabled={!edoText.trim() || !englishText.trim() || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#5A5A40] text-white rounded-xl text-sm font-bold hover:bg-[#6A6A50] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "Saving..." : <><Save size={14} /> Save Training Entry</>}
        </button>
      </div>
    </div>
  );
}
