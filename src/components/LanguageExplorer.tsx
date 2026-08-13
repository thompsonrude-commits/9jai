import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, addDoc, deleteDoc, doc, setDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { db, auth, uploadAudio } from '../lib/firebase';
import { Languages, Book, Scroll, Map, Volume2, Mic, CheckCircle2, ChevronRight, Share2, MessageSquare, Play, User as UserIcon, Users, XCircle, Loader2, Square, Edit2, Check, X, LogIn, LogOut, Sparkles, Database, Upload, FileAudio, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { speak, playEdoSpeech, recordSpeech, recordAudioBlob, EDO_PERSONAS, VoicePersona, customAudioCache } from '../lib/voice';
import EdoAssistant from './EdoAssistant';
import { LINGUISTIC_REPOSITORY } from '../lib/repository';
import { useLexicon, seedLexiconToFirestore } from '../lib/useLexicon';
import { transcribeEdoAudio } from '../lib/ai';
import { storage } from '../lib/firebase';
import { NIGERIAN_LANGUAGES } from '../lib/nigerianLanguages';
import AFRICAN_LANGUAGES from '../lib/africanLanguages';
import { getLanguageVocabulary, LanguageVocabulary } from '../lib/languageVocabularies';
import LanguageAssistant from './LanguageAssistant';
import AppHeader from './AppHeader';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  // Only log if it's not a common transient error
  if (!errInfo.error.includes('unavailable')) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

export default function LanguageExplorer({ 
  languageName, 
  currentUser, 
  isAdmin 
}: { 
  languageName: string, 
  currentUser?: User | null, 
  isAdmin?: boolean 
}) {
  const [language, setLanguage] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'assistant' | 'overview' | 'dictionary' | 'practice' | 'repository'>(() => {
    // Always open on assistant for non-Edo languages; restore for Edo
    if (languageName.toLowerCase().includes('edo') || languageName.toLowerCase().includes('bini')) {
      return (localStorage.getItem(`explorer_section_${languageName}`) as any) || 'assistant';
    }
    return 'assistant';
  });
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>(EDO_PERSONAS[0]);
  const [personalVocab, setPersonalVocab] = useState<any[]>([]);
  const [communityVocab, setCommunityVocab] = useState<any[]>([]);
  const [isAddingWord, setIsAddingWord] = useState(false);

  useEffect(() => {
    localStorage.setItem(`explorer_section_${languageName}`, activeSection);
  }, [activeSection, languageName]);

  const isEdo = languageName.toLowerCase() === 'edo' || languageName.toLowerCase() === 'bini' || languageName.toLowerCase() === 'edo (bini)';
  const { categories: lexiconCategories, loading: lexiconLoading } = useLexicon();
  // For non-Edo languages, use the static vocabulary from languageVocabularies.ts
  const staticVocab: LanguageVocabulary | null = isEdo ? null : getLanguageVocabulary(languageName);

  // Firestore Sync for Personal Vocab
  useEffect(() => {
    if (!currentUser) {
      setPersonalVocab([]);
      return;
    }

    const path = `users/${currentUser.uid}/personalVocab`;
    const vocabRef = collection(db, path);
    const q = query(vocabRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPersonalVocab(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [currentUser]);

  // Firestore Sync for Community Vocab — filtered by language
  useEffect(() => {
    const path = `communityVocab`;
    const vocabRef = collection(db, path);
    // Find language metadata first
    let currentLangId = languageName.toLowerCase();
    const allLanguageSets = [...NIGERIAN_LANGUAGES, ...AFRICAN_LANGUAGES];
    for (const region of allLanguageSets) {
      for (const lang of region.languages) {
        if (lang.name.toLowerCase() === languageName.toLowerCase() ||
            lang.name.toLowerCase().includes(languageName.toLowerCase()) ||
            languageName.toLowerCase().includes(lang.name.toLowerCase().split(' ')[0])) {
          currentLangId = lang.id;
          break;
        }
      }
      if (currentLangId !== languageName.toLowerCase()) break;
    }
    
    const q = query(
      vocabRef, 
      where('languageId', '==', currentLangId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommunityVocab(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [languageName]);

  // Seed lexicon to Firestore on mount
  useEffect(() => {
    seedLexiconToFirestore().catch(() => { /* non-critical */ });
  }, []);

  // Ensure we have a signed-in user before attempting writes to Firestore.
  // This handles races where the app triggers a write before the anonymous sign-in completes.
  const ensureSignedIn = async (): Promise<import('firebase/auth').User> => {
    if (auth.currentUser) return auth.currentUser;
    // No anonymous auth — prompt Google sign-in
    await login();
    if (auth.currentUser) return auth.currentUser;
    throw new Error('Please sign in to continue.');
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  const addWord = async (word: string, translation: string, phonetic: string, isGlobal: boolean = false, audioBlob?: Blob) => {
    const effectiveUser = currentUser || (await ensureSignedIn());
    if (!effectiveUser) return;
    const path = isGlobal ? `communityVocab` : `users/${effectiveUser.uid}/personalVocab`;

    console.log('LanguageExplorer.addWord: about to write', { path, user: { uid: effectiveUser.uid, isAnonymous: effectiveUser.isAnonymous, email: effectiveUser.email } });

    try {
      let audioUrl: string | null = null;

      // Upload audio to Firebase Storage if provided
      if (audioBlob) {
        audioUrl = await uploadAudio(`vocab-audio/${Date.now()}-${translation}.webm`, audioBlob);
      }

      const newItem: any = {
        word,
        translation,
        phonetic,
        createdAt: serverTimestamp(),
        userId: currentUser?.uid,
        author: currentUser?.displayName,
        isGlobal,
        languageId: langMeta.id,
        languageName: languageName
      };
      if (audioUrl) newItem.audioUrl = audioUrl;

      await addDoc(collection(db, path), newItem);
      setIsAddingWord(false);
    } catch (error) {
      console.error('LanguageExplorer.addWord failed', error);
      handleFirestoreError(error, OperationType.CREATE, isGlobal ? `communityVocab` : `users/${auth.currentUser?.uid}/personalVocab`);
    }
  };

  const updateWord = async (id: string, word: string, translation: string, phonetic: string, isGlobal: boolean = false, audioBlob?: Blob) => {
    try {
      const path = isGlobal ? `communityVocab/${id}` : `users/${currentUser?.uid}/personalVocab/${id}`;
      const updateData: any = { word, translation, phonetic, updatedAt: serverTimestamp() };

      if (audioBlob) {
        try {
          const audioUrl = await uploadAudio(`vocab-audio/${Date.now()}-${translation}.webm`, audioBlob);
          updateData.audioUrl = audioUrl;
          customAudioCache[translation.toLowerCase().trim()] = audioUrl;
        } catch (audioErr) {
          console.warn('Audio upload failed, saving text only:', audioErr);
        }
      }

      // Preserve languageId when updating
      if (isGlobal) {
        updateData.languageId = langMeta.id;
        updateData.languageName = languageName;
      }

      await setDoc(doc(db, path), updateData, { merge: true });
    } catch (error) {
      console.error('updateWord failed:', error);
      throw error;
    }
  };

  const updateCoreWord = async (originalId: string, word: string, translation: string, phonetic: string, audioBlob?: Blob) => {
    try {
      // Always save under the original static ID so useLexicon always finds it
      const updateData: any = { word, translation, phonetic, updatedAt: serverTimestamp() };

      if (audioBlob) {
        try {
          const audioUrl = await uploadAudio(`vocab-audio/core-${Date.now()}-${originalId}.webm`, audioBlob);
          updateData.audioUrl = audioUrl;
          customAudioCache[translation.toLowerCase().trim()] = audioUrl;
          customAudioCache[originalId.toLowerCase().trim()] = audioUrl;
          customAudioCache[word.toLowerCase().trim()] = audioUrl; // also cache by English
        } catch (audioErr) {
          console.warn('Audio upload failed, saving text only:', audioErr);
        }
      }

      // Always write to the original static ID — never rename the doc
      await setDoc(doc(db, 'coreVocabAudio', originalId), updateData, { merge: true });
    } catch (error) {
      console.error('updateCoreWord failed:', error);
      throw error;
    }
  };

  const deleteCoreWord = async (originalId: string) => {
    try {
      await deleteDoc(doc(db, 'coreVocabAudio', originalId));
      // Remove from cache
      delete customAudioCache[originalId.toLowerCase().trim()];
    } catch (error) {
      console.error('deleteCoreWord failed:', error);
      throw error;
    }
  };

  const deleteWord = async (id: string, isGlobal: boolean = false) => {
    try {
      const effectiveUser = currentUser || (await ensureSignedIn());
      if (!effectiveUser) return;
      const path = isGlobal ? `communityVocab/${id}` : `users/${effectiveUser.uid}/personalVocab/${id}`;
      console.log('LanguageExplorer.deleteWord: about to delete', { path, user: { uid: effectiveUser.uid, isAnonymous: effectiveUser.isAnonymous, email: effectiveUser.email } });
      await deleteDoc(doc(db, path));
    } catch (error) {
      console.error('LanguageExplorer.deleteWord failed', error);
      handleFirestoreError(error, OperationType.DELETE, isGlobal ? `communityVocab/${id}` : `users/${auth.currentUser?.uid}/personalVocab/${id}`);
    }
  };

  // Handle case for non-Edo languages or those without specific personas yet
  useEffect(() => {
    if (languageName.toLowerCase() !== 'edo' && EDO_PERSONAS.length > 0) {
      // For now, use generic characters if not Edo, 
      // in a production app these would be parsed from the language.lastSearchReport
    }
  }, [languageName]);

  useEffect(() => {
    setLoading(true);
    const langRef = collection(db, 'languages');
    const q = query(langRef, where('name', '==', languageName));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLanguage({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        // Fallback: build a language object from the Nigerian and African static data
        let found: any = null;
        const searchRegions = [...NIGERIAN_LANGUAGES, ...AFRICAN_LANGUAGES];
        for (const region of searchRegions) {
          for (const lang of region.languages) {
            if (lang.name.toLowerCase() === languageName.toLowerCase() ||
                lang.name.toLowerCase().includes(languageName.toLowerCase()) ||
                languageName.toLowerCase().includes(lang.name.toLowerCase().split(' ')[0])) {
              found = {
                id: lang.id,
                name: lang.name,
                location: region.name,
                lastSearchReport: `## ${lang.name} (${lang.nativeName})\n\n${lang.description}\n\n**Speakers:** ${lang.speakers}\n\n**Region:** ${region.name}\n\n*This language page is being built. Admins can add vocabulary, audio, and training data using the tools below.*`,
                sources: [],
              };
              break;
            }
          }
          if (found) break;
        }
        setLanguage(found);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [languageName]);

  // Find language metadata for the assistant
  let langMeta = { id: languageName.toLowerCase(), nativeName: languageName };
  const allLanguageSets = [...NIGERIAN_LANGUAGES, ...AFRICAN_LANGUAGES];
  for (const region of allLanguageSets) {
    for (const lang of region.languages) {
      if (lang.name.toLowerCase() === languageName.toLowerCase() ||
          lang.name.toLowerCase().includes(languageName.toLowerCase())) {
        langMeta = { id: lang.id, nativeName: lang.nativeName };
        break;
      }
    }
    if (langMeta.id !== languageName.toLowerCase()) break;
  }

  if (loading) return <div className="p-12 text-center text-[#008751]">Loading language data...</div>;
  if (!language) return (
    <div className="p-12 text-center">
      <p className="text-2xl font-serif text-[#008751] mb-2">Language not found</p>
      <p className="text-sm text-[#008751]/60">"{languageName}" is not in our database yet.</p>
    </div>
  );

  // ── When assistant is active: full-page, no header, no tabs ──────────────
  if (activeSection === 'assistant') {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden">
        <AppHeader />
        {isEdo ? (
          // Edo uses its original dedicated assistant (Ọmwan / 9jai)
          <EdoAssistant user={currentUser} isAdmin={!!isAdmin} />
        ) : (
          <LanguageAssistant
            user={currentUser}
            isAdmin={!!isAdmin}
            languageName={languageName}
            languageId={langMeta.id}
            nativeName={langMeta.nativeName}
            onNavigate={(section) => setActiveSection(section)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-12 py-12">
      <div className="flex items-end justify-between mb-12">
        <header>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] py-1 px-3 border border-[#5A5A40] text-[#5A5A40] rounded-full font-bold uppercase tracking-widest">{language.location}</span>
          </div>
          <h1 className="text-6xl font-serif text-[#1A1A1A] tracking-tighter">
            {language.name} <span className="italic font-normal">Repository</span>
          </h1>
        </header>
        
        <div className="flex gap-4 mb-2">
          {currentUser ? (
            <div className="flex items-center gap-3 mr-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-full">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-[#5A5A40]/20">
                <img src={currentUser.photoURL || ''} alt="" width={24} height={24} referrerPolicy="no-referrer" />
              </div>
              <span className="text-[10px] font-bold text-[#1A1A1A]">{currentUser.displayName}</span>
              <button 
                onClick={logout}
                className="p-1 text-[#A1A1A1] hover:text-[#A12D27] transition-colors"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#5A5A40]/30 text-[#5A5A40] rounded-full text-xs font-bold hover:bg-[#F5F5F0] transition-colors"
            >
              <LogIn size={14} />
              Sign in to Save
            </button>
          )}

          <div className="flex items-center gap-2 mr-4 bg-[#F5F5F0] p-1 rounded-full border border-[#E5E5E5]">
             <span className="text-[9px] uppercase tracking-widest font-bold px-3 text-[#5A5A40]">Voice: {selectedPersona.name}</span>
             <div className="flex gap-1">
               {EDO_PERSONAS.slice(0, 4).map((p) => (
                 <button 
                   key={p.name}
                   onClick={() => {
                     setSelectedPersona(p);
                     speak(`I am ${p.name}, ready to assist.`, p, false);
                   }}
                   className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${selectedPersona.name === p.name ? 'bg-[#5A5A40] text-white shadow-sm' : 'bg-white text-[#A1A1A1] hover:text-[#5A5A40]'}`}
                 >
                   {p.name[0]}
                 </button>
               ))}
             </div>
          </div>
          <button 
            onClick={() => speak(`Now reading the linguistic dossier for ${language.name}. ${language.lastSearchReport.replace(/[#*]/g, '')}`, selectedPersona, false)}
            className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-xs font-medium hover:bg-[#4A4A30] transition-colors shadow-sm"
          >
            <Volume2 size={16} />
            Listen to Dossier
          </button>
          <ActionButton icon={<Share2 />} />
          <ActionButton icon={<MessageSquare />} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#E5E5E5] mb-12">
        <TabItem
          active={false}
          onClick={() => setActiveSection('assistant')}
          label="← AI Assistant"
          icon={<Sparkles />}
        />
        <TabItem 
          active={activeSection === 'overview'} 
          onClick={() => setActiveSection('overview')} 
          label="Overview & History" 
          icon={<Scroll />} 
        />
        <TabItem 
          active={activeSection === 'dictionary'} 
          onClick={() => setActiveSection('dictionary')} 
          label="Lexicon & Dictionary" 
          icon={<Book />} 
        />
        {isEdo && (
          <TabItem 
            active={activeSection === 'practice'} 
            onClick={() => setActiveSection('practice')} 
            label="Voice Lab" 
            icon={<Mic />} 
          />
        )}
        <TabItem 
          active={activeSection === 'repository'} 
          onClick={() => setActiveSection('repository')} 
          label="Linguistic Repository" 
          icon={<Database />} 
        />
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-2 gap-12"
          >
            <div className="prose prose-stone prose-lg max-w-none prose-headings:font-serif">
               <div className="bg-white p-8 rounded-[40px] border border-[#E5E5E5] shadow-sm">
                 <ReactMarkdown>{language.lastSearchReport}</ReactMarkdown>
               </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-[#1A1A1A] text-white p-10 rounded-[40px] relative overflow-hidden">
                <Map className="absolute top-8 right-8 w-16 h-16 opacity-10" />
                <h3 className="text-[10px] uppercase tracking-widest mb-6 opacity-60 font-bold">Location Profile</h3>
                <p className="text-2xl font-serif mb-4 leading-snug">{language.location}</p>
                <div className="h-[2px] w-12 bg-white/20 mb-6" />
                <p className="text-sm opacity-80 leading-relaxed">This territory represents the cultural cradle where {language.name} has breathed for centuries.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Learned Words" value="0" />
                <StatBox label="Mastery Level" value="Beginner" />
              </div>

              {language.sources && (
                <div className="p-8 rounded-[40px] border border-[#E5E5E5]">
                  <h4 className="text-[10px] uppercase tracking-widest mb-4 font-bold">Citations & Archives</h4>
                  <div className="space-y-4">
                    {language.sources.map((s: any, i: number) => (
                      <a key={i} href={s.web?.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-[#5A5A40] hover:text-[#1A1A1A] group">
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        <span className="truncate">{s.web?.title || 'Archive Link'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-8 rounded-[40px] bg-[#F5F5F0] border border-[#E5E5E5]">
                <h4 className="text-[10px] uppercase tracking-widest mb-6 font-bold text-[#5A5A40]">Advanced Grammar Lab</h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-[#A1A1A1] uppercase mb-1">Emphasis (Focus Marker)</p>
                    <p className="text-sm font-medium mb-1">Edo uses <strong>ọre</strong> to focus an element.</p>
                    <p className="text-xs italic text-[#5A5A40]">"Ize ọre ọ rrie owa" - It is Ize who went home.</p>
                  </div>
                  <div className="h-[1px] bg-[#E5E5E5]" />
                  <div>
                    <p className="text-[10px] font-bold text-[#A1A1A1] uppercase mb-1">Interrogative Sentence Structure</p>
                    <p className="text-sm font-medium mb-1">Focus often pairs with questions.</p>
                    <p className="text-xs italic text-[#5A5A40]">"Vbọ ọre u dẹ?" - What (is it that) you bought?</p>
                  </div>
                  <div className="h-[1px] bg-[#E5E5E5]" />
                  <div>
                    <p className="text-[10px] font-bold text-[#A1A1A1] uppercase mb-1">Serial Verb Constructions (SVC)</p>
                    <p className="text-sm font-medium mb-1">Multiple verbs describing one event.</p>
                    <p className="text-xs italic text-[#5A5A40]">"Ọ gbe ẹmọ khiẹn" - He killed and sold the cow.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'dictionary' && (
          <motion.div key="dictionary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Header bar */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-serif text-[#1A1A1A]">Lexical Dictionary</h3>
                <p className="text-xs text-[#5A5A40] mt-0.5">
                  {isEdo
                    ? `${lexiconCategories.reduce((n, c) => n + c.entries.length, 0)} words · hover to play · click pencil to edit`
                    : staticVocab
                      ? `${staticVocab.categories.reduce((n, c) => n + c.items.length, 0)} words · click speaker to hear`
                      : 'Vocabulary being compiled — check back soon'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <button onClick={() => setIsAddingWord(!isAddingWord)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-xs font-bold hover:bg-[#4A4A30] transition-all">
                    <Sparkles size={13} /> Add Word
                  </button>
                )}
                {currentUser && (
                  <button onClick={() => setIsAddingWord(!isAddingWord)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white rounded-full text-xs font-bold hover:bg-[#333] transition-all">
                    {isAddingWord ? <X size={13} /> : <Plus size={13} />}
                    {isAddingWord ? 'Cancel' : 'My Word'}
                  </button>
                )}
              </div>
            </div>

            {/* Add word form */}
            <AnimatePresence>
              {isAddingWord && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                  <AddWordForm onAdd={(w, t, p, blob) => addWord(w, t, p, isAdmin, blob)} onCancel={() => setIsAddingWord(false)} isAdmin={isAdmin} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Personal vocab */}
            {currentUser && personalVocab.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40] mb-2 px-1">My Words</p>
                <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden divide-y divide-[#F0F0F0]">
                  {personalVocab.map(item => (
                    <WordRow key={item.id} word={item.word} translation={item.translation} phonetic={item.phonetic}
                      audioUrl={item.audioUrl} isAdmin={isAdmin} isPersonal
                      onDelete={() => deleteWord(item.id)}
                      onUpdate={(w, t, p, blob) => updateWord(item.id, w, t, p, false, blob)} />
                  ))}
                </div>
              </div>
            )}

            {/* EDO: use Firestore lexicon */}
            {isEdo && (
              lexiconLoading ? (
                <div className="text-center py-8 text-[#5A5A40] text-sm">Loading lexicon...</div>
              ) : (
                <div className="space-y-4">
                  {lexiconCategories.map(cat => (
                    <div key={cat.category}>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40] mb-1.5 px-1 flex items-center gap-2">
                        {cat.category}
                        <span className="text-[#A1A1A1] font-normal normal-case tracking-normal">{cat.entries.length}</span>
                      </p>
                      <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden divide-y divide-[#F0F0F0]">
                        {cat.entries.map(entry => (
                          <WordRow key={entry.id} word={entry.english} translation={entry.edoWord}
                            phonetic={entry.phonetic} audioUrl={entry.audioUrl} isAdmin={isAdmin}
                            onUpdate={(w, t, p, blob) => updateCoreWord(entry.id, w, t, p, blob)}
                            onDelete={isAdmin ? () => deleteCoreWord(entry.id) : undefined} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* NON-EDO: use static vocabulary from languageVocabularies.ts */}
            {!isEdo && staticVocab && (
              <div className="space-y-4">
                {/* Grammar notes */}
                {staticVocab.grammarNotes && (
                  <div className="p-6 bg-[#F5F5F0] rounded-2xl border border-[#E5E5E5] mb-6">
                    <div className="prose prose-sm prose-stone max-w-none">
                      <ReactMarkdown>{staticVocab.grammarNotes}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {staticVocab.categories.map(cat => (
                  <div key={cat.category}>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40] mb-1.5 px-1 flex items-center gap-2">
                      {cat.category}
                      <span className="text-[#A1A1A1] font-normal normal-case tracking-normal">{cat.items.length}</span>
                    </p>
                    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden divide-y divide-[#F0F0F0]">
                      {cat.items.map((entry, i) => (
                        <WordRow key={i}
                          word={entry.translation}
                          translation={entry.term}
                          phonetic={entry.phonetic}
                          isAdmin={isAdmin}
                          onUpdate={isAdmin ? (w, t, p, blob) => updateCoreWord(entry.term, w, t, p, blob) : undefined}
                          onDelete={isAdmin ? () => deleteCoreWord(entry.term) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No vocab found */}
            {!isEdo && !staticVocab && (
              <div className="text-center py-16 text-[#5A5A40]">
                <Database size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-serif mb-2">Vocabulary Coming Soon</p>
                <p className="text-sm opacity-60">Our team is compiling the {languageName} lexicon. Admins can add words using the button above.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto py-12"
            >
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div className="text-center bg-[#F5F5F0] p-12 rounded-[40px] border border-[#E5E5E5]">
                  <div className="mb-8 relative inline-block">
                    <div className="w-32 h-32 bg-[#5A5A40] rounded-full flex items-center justify-center text-white shadow-2xl relative z-10 mx-auto cursor-pointer hover:scale-105 transition-transform group">
                      <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute inset-0 bg-[#5A5A40]/10 rounded-full animate-ping" />
                  </div>
                  <h3 className="text-3xl font-serif mb-4 text-[#1A1A1A]">Voice Lab</h3>
                  <p className="text-[#5A5A40] text-sm leading-relaxed mb-8">
                    Calibrate your phonetics. Speak directly into the mic to compare your resonance against AI Edo models.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => speak(`Welcome to the voice training for ${language.name}`, selectedPersona)}
                      className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Initialize Lab
                    </button>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => playEdoSpeech("Vbẹe oye hẹ?")}
                        className="flex-1 py-4 border border-[#5A5A40]/20 text-[#5A5A40] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                      >
                        <Volume2 size={14} /> Sample
                      </button>
                      <button 
                         className="flex-1 py-4 border border-[#5A5A40]/20 text-[#5A5A40] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
                      >
                        Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#A1A1A1] pl-2">Conversational Drills</h4>
                   <div className="space-y-3">
                      {[
                        { edo: "Vbẹe u rrie hẹ?", en: "Where are you going?" },
                        { edo: "I rrie owa", en: "I am going home" },
                        { edo: "Vbọ ọre u dẹ?", en: "What did you buy?" },
                        { edo: "Uru ese", en: "Thank you" }
                      ].map((drill, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl border border-[#E5E5E5] flex items-center justify-between group hover:border-[#5A5A40] transition-colors">
                          <div>
                            <p className="text-lg font-serif mb-1">{drill.edo}</p>
                            <p className="text-[10px] text-[#A1A1A1] font-bold uppercase">{drill.en}</p>
                          </div>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => playEdoSpeech(drill.edo)}
                               className="p-3 bg-[#F5F5F0] text-[#5A5A40] rounded-full hover:bg-[#5A5A40] hover:text-white transition-all"
                             >
                               <Volume2 size={16} />
                             </button>
                             <button className="p-3 bg-[#1A1A1A] text-white rounded-full hover:bg-black transition-all scale-90 group-hover:scale-100">
                               <Mic size={16} />
                             </button>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Cultural Resources Section */}
              <div className="mt-20 pt-12 border-t border-[#E5E5E5]">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-[#5A5A40]/10 rounded-lg text-[#5A5A40]">
                    <Database size={20} />
                  </div>
                  <h4 className="text-xl font-serif">Cultural Audio Archives</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <a 
                    href="https://www.divinerevelations.info/documents/bible/edo_mp3_bible/edo_bsn_nt_drama/?dir=_chapters_" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-6 bg-[#F5F5F0] rounded-3xl border border-transparent hover:border-[#5A5A40] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]">Primary Audio Source</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h5 className="text-lg font-serif mb-2">Edo MP3 Audio Bible</h5>
                    <p className="text-[#A1A1A1] text-xs leading-relaxed">
                      A comprehensive dramatic recording of the New Testament in Bini. Ideal for understanding natural cadence, tone, and pronunciation of complex Edo sentences.
                    </p>
                  </a>

                  <div className="p-6 bg-white rounded-3xl border border-[#E5E5E5]">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#A1A1A1] inline-block mb-4">AI Integration note</span>
                    <h5 className="text-lg font-serif mb-2">Linguistic Training</h5>
                    <p className="text-[#A1A1A1] text-xs leading-relaxed">
                      This application uses AI voices trained on linguistic patterns found in archival recordings like the Edo Bible to ensure phonetic fidelity.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
        )}

        {activeSection === 'repository' && (
            <motion.div
              key="repository"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12 pb-20"
            >
              <div className="bg-[#1A1A1A] text-white p-12 rounded-[40px] relative overflow-hidden">
                <Database className="absolute top-12 right-12 w-24 h-24 opacity-10" />
                <h3 className="text-[10px] uppercase tracking-widest mb-6 opacity-60 font-bold">Linguistic Dossier</h3>
                <h2 className="text-4xl font-serif mb-4 leading-tight">Master Record of {languageName} <br/><span className="italic font-normal">Language & Culture</span></h2>
                <p className="text-sm opacity-80 max-w-xl leading-relaxed">This repository serves as the definitive record of the research, translations, and pedagogical materials generated during our collaboration. It is directly used to ground the AI's understanding of {langMeta.nativeName}.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Community Submissions */}
                {communityVocab.length > 0 && (
                   <div className="bg-[#1A1A1A] p-8 rounded-[40px] border border-[#E5E5E5] shadow-xl md:col-span-2">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-500">
                            <Sparkles size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-serif text-white">Community Contributions</h4>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Linguistic field additions</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-white bg-white/10 px-3 py-1 rounded-full uppercase tracking-tighter">{communityVocab.length} Entries</span>
                      </div>
                      <div className="divide-y divide-[#2A2A2A]">
                        {communityVocab.map((item) => (
                          <WordRow
                             key={item.id}
                             word={item.word}
                             translation={item.translation}
                             phonetic={item.phonetic}
                             audioUrl={item.audioUrl}
                             onUpdate={(w, t, p, blob) => updateWord(item.id, w, t, p, true, blob)}
                             isPersonal={isAdmin || item.userId === currentUser?.uid}
                             onDelete={isAdmin || item.userId === currentUser?.uid ? () => deleteWord(item.id, true) : undefined}
                             isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                   </div>
                )}

                {LINGUISTIC_REPOSITORY.map((cat, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[40px] border border-[#E5E5E5] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-lg font-serif">{cat.category}</h4>
                      <span className="text-[10px] font-bold text-[#5A5A40] bg-[#F5F5F0] px-3 py-1 rounded-full uppercase tracking-tighter">{cat.items.length} Entries</span>
                    </div>
                    <div className="space-y-0 divide-y divide-[#F0F0F0]">
                      {cat.items.map((item, i) => (
                        <WordRow
                           key={i}
                           word={item.term}
                           translation={item.translation}
                           phonetic={item.phonetic}
                           isAdmin={isAdmin}
                           onUpdate={isAdmin ? (w, t, p, blob) => updateCoreWord(item.term, w, t, p, blob) : undefined}
                           onDelete={isAdmin ? () => deleteCoreWord(item.term) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabItem({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactElement }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 flex items-center gap-2 text-sm transition-all relative ${
        active ? 'text-[#1A1A1A] font-bold' : 'text-[#A1A1A1] hover:text-[#5A5A40]'
      }`}
    >
      {React.cloneElement(icon, { size: 16 } as any)}
      {label}
      {active && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A]" />}
    </button>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-6 rounded-[32px] bg-white border border-[#E5E5E5] flex flex-col justify-between h-32">
      <span className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40]">{label}</span>
      <span className="text-3xl font-serif">{value}</span>
    </div>
  );
}

function WordRow({ word, translation, phonetic, audioUrl: initialAudioUrl, isAdmin, isPersonal, onDelete, onUpdate }: {
  word: string; translation: string; phonetic: string; audioUrl?: string;
  isAdmin?: boolean; isPersonal?: boolean;
  onDelete?: () => void;
  onUpdate?: (w: string, t: string, p: string, blob?: Blob) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editWord, setEditWord] = useState(word);
  const [editTranslation, setEditTranslation] = useState(translation);
  const [editPhonetic, setEditPhonetic] = useState(phonetic);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(initialAudioUrl ?? null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const recorderRef = React.useRef<{ stop: () => void } | null>(null);
  const timerRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync when parent data changes
  React.useEffect(() => { setAudioPreviewUrl(initialAudioUrl ?? null); }, [initialAudioUrl]);

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioPreviewUrl) new Audio(audioPreviewUrl).play();
    else playEdoSpeech(translation);
  };

  const startRecording = async () => {
    setIsRecording(true); setRecordingSeconds(0); setAudioBlob(null);
    timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    const recorder = recordAudioBlob(s => { if (s === 'error' || s === 'done') { setIsRecording(false); clearInterval(timerRef.current); } });
    recorderRef.current = recorder;
    const { blob } = await recorder.promise;
    setIsRecording(false); clearInterval(timerRef.current); recorderRef.current = null;
    setAudioBlob(blob); setAudioPreviewUrl(URL.createObjectURL(blob));
  };

  const stopRecording = () => { recorderRef.current?.stop(); recorderRef.current = null; setIsRecording(false); clearInterval(timerRef.current); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setAudioBlob(f); setAudioPreviewUrl(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(editWord, editTranslation, editPhonetic, audioBlob ?? undefined);
      setAudioBlob(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsSaving(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
      setIsEditing(false);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = 'w-full border-2 border-[#E5E5E5] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/20 transition-colors bg-white text-[#1A1A1A] placeholder-[#A1A1A1]';

  return (
    <div className="flex flex-col p-6 bg-white rounded-3xl border border-[#E5E5E5] hover:border-[#5A5A40] transition-all relative group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#A1A1A1]">{word}</span>
            {isPersonal && <span className="text-[8px] bg-[#5A5A40] text-white px-2 py-0.5 rounded-full uppercase">Self-Added</span>}
            {audioPreviewUrl && <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><Mic size={8} /> Audio</span>}
          </div>

          {isEditing ? (
            <div className="mt-2 p-3 bg-[#F8F8F5] rounded-xl border border-[#D5D5C5] space-y-2">
              {/* Header */}
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#E5E5E5]">
                <Edit2 size={10} className="text-[#5A5A40]" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#5A5A40]">
                  {isAdmin ? 'Admin Editor' : 'Edit'}
                </span>
              </div>

              {/* English meaning */}
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-[#A1A1A1] block mb-0.5">English</label>
                <input
                  disabled={isSaving}
                  value={editWord}
                  onChange={e => setEditWord(e.target.value)}
                  className="w-full text-xs border border-[#E5E5E5] rounded-lg px-2 py-1.5 outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]/10 bg-white disabled:opacity-50 transition-all"
                  placeholder="e.g. Good morning"
                />
              </div>

              {/* Edo word */}
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-[#A1A1A1] block mb-0.5">Edo Word</label>
                <input
                  disabled={isSaving}
                  value={editTranslation}
                  onChange={e => setEditTranslation(e.target.value)}
                  className="w-full text-base font-serif border border-[#5A5A40]/30 rounded-lg px-2 py-1.5 outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]/10 bg-white disabled:opacity-50 transition-all"
                  placeholder="e.g. Obowie"
                />
              </div>

              {/* Phonetic */}
              <div>
                <label className="text-[8px] font-bold uppercase tracking-widest text-[#A1A1A1] block mb-0.5">Phonetic</label>
                <input
                  disabled={isSaving}
                  value={editPhonetic}
                  onChange={e => setEditPhonetic(e.target.value)}
                  className="w-full text-xs italic border border-[#E5E5E5] rounded-lg px-2 py-1.5 outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]/10 bg-white disabled:opacity-50 transition-all text-[#5A5A40]"
                  placeholder="e.g. /Oh-bo-wee-eh/"
                />
              </div>

              {/* Admin audio panel */}
              {isAdmin && (
                <div className="p-2 bg-white rounded-lg border border-[#E5E5E5] space-y-1.5">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#5A5A40] block">
                    🎙 Audio
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button type="button" onClick={isRecording ? stopRecording : startRecording}
                      disabled={isSaving}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#5A5A40] text-white hover:bg-[#4A4A30]'} disabled:opacity-50`}>
                      {isRecording ? <Square size={8} fill="currentColor" /> : <Mic size={8} />}
                      {isRecording ? `${recordingSeconds}s` : 'Rec'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest bg-[#F5F5F0] text-[#5A5A40] border border-[#E5E5E5] hover:border-[#5A5A40] transition-all disabled:opacity-50">
                      <Upload size={8} /> File
                    </button>
                    {audioPreviewUrl && (
                      <>
                        <button type="button" onClick={() => new Audio(audioPreviewUrl).play()}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50">
                          <Play size={8} fill="currentColor" /> Play
                        </button>
                        <button type="button" onClick={() => { setAudioBlob(null); setAudioPreviewUrl(null); }}
                          disabled={isSaving}
                          className="p-1 text-[#A1A1A1] hover:text-red-500 transition-colors disabled:opacity-50" title="Clear">
                          <Trash2 size={10} />
                        </button>
                      </>
                    )}
                  </div>
                  {isRecording && <p className="text-[7px] text-red-500 font-bold animate-pulse uppercase">● Recording...</p>}
                  {audioBlob && !isRecording && <p className="text-[7px] text-green-600 font-bold uppercase">✓ Ready</p>}
                </div>
              )}

              {/* Save / Cancel / Delete */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5 pt-1 border-t border-[#E5E5E5]">
                  <button
                    onClick={save}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-white bg-[#1A1A1A] px-3 py-1.5 rounded-full hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                  >
                    <Check size={9} /> {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setAudioBlob(null); setAudioPreviewUrl(initialAudioUrl ?? null); setShowDeleteConfirm(false); }} 
                    disabled={isSaving}
                    className="text-[8px] font-bold uppercase tracking-widest text-[#A1A1A1] px-3 py-1.5 border border-[#E5E5E5] rounded-full hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>

                {/* Delete section - only for admin */}
                {onDelete && isAdmin && (
                  <div className="pt-1 border-t border-[#E5E5E5]">
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-widest text-[#A12D27] px-3 py-1.5 border border-[#A12D27]/30 rounded-full hover:bg-[#A12D27]/5 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={9} /> Delete
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[7px] text-center text-[#A12D27] font-bold uppercase">⚠️ Confirm?</p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-widest text-white bg-[#A12D27] px-2 py-1.5 rounded-full hover:bg-[#8B1F1F] transition-all disabled:opacity-50"
                          >
                            <Trash2 size={9} /> {isSaving ? 'Deleting...' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isSaving}
                            className="flex-1 text-[8px] font-bold uppercase tracking-widest text-[#A1A1A1] px-2 py-1.5 border border-[#E5E5E5] rounded-full hover:bg-gray-50 transition-all disabled:opacity-50"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h5 className="text-xl font-serif text-[#1A1A1A]">{translation}</h5>
                {(isAdmin || onUpdate) && (
                <button onClick={() => { setIsEditing(true); setEditWord(word); setEditTranslation(translation); setEditPhonetic(phonetic); }}
                    className="p-1 text-[#A1A1A1] hover:text-[#5A5A40] transition-colors" title="Edit / Record pronunciation">
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] text-[#A1A1A1] italic">/{phonetic}/</span>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={playAudio}
              className="p-3 bg-[#F5F5F0] text-[#5A5A40] rounded-full hover:bg-[#5A5A40] hover:text-white transition-all shadow-sm relative"
              title={audioPreviewUrl ? 'Play recorded audio' : 'Listen (TTS)'}>
              <Volume2 size={18} />
              {audioPreviewUrl && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />}
            </button>
            
            {/* Delete button - visible for admin */}
            {onDelete && isAdmin && (
              <button 
                onClick={() => {
                  if (window.confirm(`Delete "${translation}"?\n\nThis action cannot be undone.`)) {
                    handleDelete();
                  }
                }}
                disabled={isSaving}
                className="p-3 bg-red-50 text-[#A12D27] rounded-full hover:bg-[#A12D27] hover:text-white transition-all shadow-sm disabled:opacity-50"
                title="Delete this word"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function ActionButton({ icon }: { icon: React.ReactElement }) {
  return (
    <button className="p-4 bg-white border border-[#E5E5E5] rounded-full text-[#5A5A40] hover:bg-[#F5F5F0] transition-colors">
      {React.cloneElement(icon, { size: 20 } as any)}
    </button>
  );
}

function AddWordForm({ onAdd, onCancel, isAdmin }: { onAdd: (w: string, t: string, ph: string, audioBlob?: Blob) => void, onCancel: () => void, isAdmin?: boolean }) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const recorderRef = React.useRef<{ stop: () => void } | null>(null);
  const timerRef = React.useRef<any>(null);

  const startVoiceEntry = async () => {
    try {
      setIsRecording(true);
      setRecordingSeconds(0);
      setAudioPreviewUrl(null);
      setAudioBlob(null);

      // Tick counter so user sees elapsed time
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      const recorder = recordAudioBlob((status) => {
        if (status === 'error' || status === 'done') {
          setIsRecording(false);
          clearInterval(timerRef.current);
        }
      });
      recorderRef.current = recorder;

      const { blob } = await recorder.promise;
      setIsRecording(false);
      clearInterval(timerRef.current);
      recorderRef.current = null;

      // Store blob and create preview — admin types the word manually
      setAudioBlob(blob);
      setAudioPreviewUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Voice entry failed", error);
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const stopVoiceEntry = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  const clearAudio = () => {
    setAudioPreviewUrl(null);
    setAudioBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word && translation) {
      onAdd(word, translation, phonetic || translation, audioBlob ?? undefined);
      setWord('');
      setTranslation('');
      setPhonetic('');
      clearAudio();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`p-8 rounded-3xl border shadow-inner mb-6 transition-colors ${isAdmin ? 'bg-[#1A1A1A] border-[#333]' : 'bg-white border-[#D5D5C5]'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isAdmin ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#5A5A40]/10 text-[#5A5A40]'}`}>
            {isAdmin ? <Sparkles size={18} /> : <FileAudio size={18} />}
          </div>
          <div>
            <h4 className={`text-lg font-serif ${isAdmin ? 'text-white' : 'text-[#1A1A1A]'}`}>
              {isAdmin ? 'Master Entry Contribution' : 'New Vocabulary Entry'}
            </h4>
            <p className={`text-[10px] uppercase tracking-widest font-bold ${isAdmin ? 'text-white/40' : 'text-[#A1A1A1]'}`}>
              {isAdmin ? 'Global Repository Access' : 'Personal Collection'}
            </p>
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="audio/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            isAdmin ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#F5F5F0] text-[#5A5A40] hover:bg-[#E5E5D5]'
          }`}
        >
          <Upload size={14} />
          Upload Reference
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block ${isAdmin ? 'text-white/60' : 'text-[#A1A1A1]'}`}>English Meaning</label>
            <input 
              type="text" 
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. Bread"
              className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
                isAdmin ? 'bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder-[#666] focus:ring-yellow-500 focus:border-yellow-500' : 'bg-[#F5F5F0] border-[#E5E5E5] text-black focus:ring-[#5A5A40] focus:border-[#5A5A40]'
              }`}
              required
            />
          </div>
          <div>
            <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block ${isAdmin ? 'text-white/60' : 'text-[#A1A1A1]'}`}>Phonetic (AI Guide)</label>
            <input 
              type="text" 
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder="e.g. Eh-booo-ray-dee"
              className={`w-full border rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
                isAdmin ? 'bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder-[#666] focus:ring-yellow-500 focus:border-yellow-500' : 'bg-[#F5F5F0] border-[#E5E5E5] text-black focus:ring-[#5A5A40] focus:border-[#5A5A40]'
              }`}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className={`text-[10px] uppercase tracking-widest font-bold mb-2 block ${isAdmin ? 'text-white/60' : 'text-[#A1A1A1]'}`}>Edo Word</label>
          <input 
            type="text" 
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="e.g. Eburendi"
            className={`w-full border rounded-xl px-4 py-6 text-xl font-serif transition-colors focus:outline-none focus:ring-2 ${
              isAdmin ? 'bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder-[#666] focus:ring-yellow-500 focus:border-yellow-500' : 'bg-[#F5F5F0] border-[#E5E5E5] text-black focus:ring-[#5A5A40] focus:border-[#5A5A40]'
            }`}
            required
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {audioPreviewUrl && (
                <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${isAdmin ? 'bg-white/5 border-white/10' : 'bg-[#F5F5F0] border-[#D5D5C5]'}`}>
                  <button
                    type="button"
                    onClick={() => {
                        const audio = new Audio(audioPreviewUrl);
                        audio.play();
                    }}
                    className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-400 transition-all shadow-md group"
                    title="Play recorded sample"
                  >
                    <Play size={16} fill="currentColor" className="group-active:scale-90 transition-transform" />
                  </button>
                  <div className="px-2">
                    <p className={`text-[9px] font-bold uppercase tracking-tighter ${isAdmin ? 'text-white/60' : 'text-[#5A5A40]'}`}>Audio Captured</p>
                    <p className={`text-[8px] ${isAdmin ? 'text-white/30' : 'text-[#A1A1A1]'}`}>Type the Edo word above</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAudio}
                    className={`p-3 transition-all rounded-full ${isAdmin ? 'hover:bg-red-500/10 text-white/30 hover:text-red-500' : 'hover:bg-red-50 text-[#A1A1A1] hover:text-red-500'}`}
                    title="Clear recording"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={isRecording ? stopVoiceEntry : startVoiceEntry}
                className={`flex items-center gap-3 px-6 py-4 rounded-full transition-all shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse scale-105' 
                    : (isAdmin ? 'bg-white text-black hover:bg-yellow-500' : 'bg-[#1A1A1A] text-white hover:bg-[#333]')
                }`}
                title={isRecording ? 'Stop recording' : 'Record Edo word'}
              >
                {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {isRecording ? `Stop (${recordingSeconds}s)` : 'Voice Capture'}
                </span>
              </button>
            </div>
          </div>

          {isRecording && (
            <p className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-widest">
              Recording word ({recordingSeconds}s)... press Stop when done
            </p>
          )}
          {audioPreviewUrl && !isRecording && (
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
              ✓ Audio saved — now type the Edo word and phonetic above
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
        <button 
          type="button" 
          onClick={onCancel}
          className={`px-6 py-2 text-xs font-bold transition-all ${isAdmin ? 'text-white/40 hover:text-white' : 'text-[#A1A1A1] hover:text-[#1A1A1A]'}`}
        >
          Cancel
        </button>
        <button 
          type="submit"
          className={`px-10 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
            isAdmin ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-[#1A1A1A] text-white hover:bg-black'
          }`}
        >
          {isAdmin ? 'Publish to Repository' : 'Save to My Dictionary'}
        </button>
      </div>
    </form>
  );
}

