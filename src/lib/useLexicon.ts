/**
 * useLexicon — shared hook that provides the complete Edo vocabulary
 * from both the static LINGUISTIC_REPOSITORY and Firestore (coreVocabAudio + communityVocab).
 *
 * Used by: LanguageExplorer (dictionary tab), EdoAssistant (vocab context),
 * Voice Lab (drills), and any future component that needs Edo words.
 */
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LINGUISTIC_REPOSITORY } from './repository';
import { customAudioCache } from './voice';

export interface LexiconEntry {
  id: string;           // Edo word used as key
  edoWord: string;      // Edo term
  english: string;      // English meaning
  phonetic: string;     // Pronunciation guide
  category: string;     // Category from repository
  audioUrl?: string;    // Admin-recorded audio URL from Firebase Storage
  context?: string;     // Optional usage note
  isSeeded: boolean;    // true = came from static repo, false = community added
}

export interface LexiconCategory {
  category: string;
  entries: LexiconEntry[];
}

/**
 * Seed all LINGUISTIC_REPOSITORY words into Firestore coreVocabAudio
 * so they are available app-wide. Only writes if the doc doesn't exist.
 */
export async function seedLexiconToFirestore() {
  // Disabled: There is no need to bulk write the static dictionary to Firestore on every load.
  // The app merges static data with Firebase overrides in-memory via the useLexicon hook.
  // Admin edits (updateCoreWord) will automatically create the document using { merge: true } if needed.
  return Promise.resolve();
}

export function useLexicon() {
  const [categories, setCategories] = useState<LexiconCategory[]>([]);
  const [allEntries, setAllEntries] = useState<LexiconEntry[]>([]);
  const [trainingContext, setTrainingContext] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Single persistent baseMap — never recreated, only updated
    const baseMap = new Map<string, LexiconEntry>();

    // Seed static repository into baseMap first
    for (const cat of LINGUISTIC_REPOSITORY) {
      for (const item of cat.items) {
        baseMap.set(item.term, {
          id: item.term,
          edoWord: item.term,
          english: item.translation,
          phonetic: item.phonetic,
          category: cat.category,
          context: item.context,
          isSeeded: true,
        });
      }
    }

    // Subscribe to coreVocabAudio — fires immediately with current data
    const unsubCore = onSnapshot(collection(db, 'coreVocabAudio'), (snap) => {
      if (!active) return;
      snap.docs.forEach(d => {
        const data = d.data();
        const staticId = d.id;
        const existing = baseMap.get(staticId);
        const edoWord = data.translation || existing?.edoWord || staticId;
        const audioUrl = data.audioUrl || existing?.audioUrl;

        // Always update the global audio cache — this is the key line
        if (audioUrl && edoWord) {
          customAudioCache[edoWord.toLowerCase().trim()] = audioUrl;
          // Also cache by English word for broader matching
          if (data.word) {
            customAudioCache[data.word.toLowerCase().trim()] = audioUrl;
          }
        }

        baseMap.set(staticId, {
          id: staticId,
          edoWord,
          english: data.word || existing?.english || '',
          phonetic: data.phonetic || existing?.phonetic || '',
          category: data.category || existing?.category || 'General',
          audioUrl,
          context: data.context || existing?.context,
          isSeeded: true,
        });
      });
      rebuild(baseMap);
    }, (error) => {
      console.error('Error fetching coreVocabAudio:', error);
      if (active) rebuild(baseMap);
    });

    // Subscribe to communityVocab
    const unsubCommunity = onSnapshot(collection(db, 'communityVocab'), (snap) => {
      if (!active) return;
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.translation) return;
        const edoWord = data.translation;
        const audioUrl = data.audioUrl;

        if (audioUrl) {
          customAudioCache[edoWord.toLowerCase().trim()] = audioUrl;
          if (data.word) {
            customAudioCache[data.word.toLowerCase().trim()] = audioUrl;
          }
        }

        baseMap.set(data.translation, {
          id: data.translation,
          edoWord,
          english: data.word || '',
          phonetic: data.phonetic || '',
          category: data.category || 'Community',
          audioUrl,
          isSeeded: false,
        });
      });
      rebuild(baseMap);
    }, (error) => {
      console.error('Error fetching communityVocab:', error);
      if (active) rebuild(baseMap);
    });

    function rebuild(map: Map<string, LexiconEntry>) {
      const entries = Array.from(map.values());
      setAllEntries(entries);

      const catOrder = LINGUISTIC_REPOSITORY.map(c => c.category);
      const catMap = new Map<string, LexiconEntry[]>();
      for (const entry of entries) {
        const cat = entry.category || 'General';
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat)!.push(entry);
      }

      const ordered: LexiconCategory[] = [];
      for (const cat of catOrder) {
        if (catMap.has(cat)) {
          ordered.push({ category: cat, entries: catMap.get(cat)! });
          catMap.delete(cat);
        }
      }
      for (const [cat, entries] of catMap) {
        ordered.push({ category: cat, entries });
      }

      setCategories(ordered);
      setLoading(false);
    }

    return () => {
      active = false;
      unsubCore();
      unsubCommunity();
    };
  }, []); // Empty deps — subscribe once, never re-initialize

  // Subscribe to admin training data
  useEffect(() => {
    const unsubTraining = onSnapshot(
      collection(db, 'aiTraining'),
      (snap) => {
        if (snap.empty) { setTrainingContext(''); return; }
        const lines: string[] = [];
        snap.docs.forEach(d => {
          const data = d.data();
          const type = data.type ?? 'general';
          const edo = data.edoText ?? '';
          const eng = data.englishText ?? '';
          const ctx = data.context ? ` [${data.context}]` : '';
          const corr = data.correction ? ` CORRECTION: ${data.correction}` : '';
          lines.push(`[${type.toUpperCase()}] ${edo} = ${eng}${ctx}${corr}`);
        });
        setTrainingContext(lines.join('\n'));
      }
    );
    return unsubTraining;
  }, []);

  // Build a plain text vocab context string for the AI assistant
  const vocabContextString = allEntries
    .map(e => `${e.english} = ${e.edoWord} (/${e.phonetic}/)`)
    .join('\n');

  return { categories, allEntries, loading, vocabContextString, trainingContext };
}
