import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type LexiconEntry = {
  id: string;
  word: string;
  spellingVariants?: string[];
  englishMeaning?: string;
  edoMeaning?: string;
  grammaticalCategory?: string;
  examples?: string[];
  source?: string; // provenance (URL or note)
  confidence?: number; // 0.0 - 1.0
  trainerApproval?: 'draft' | 'pending_review' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
};

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'edo_lexicon.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAll(): LexiconEntry[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed as LexiconEntry[];
  } catch (err) {
    console.warn('[edoLexiconStore] readAll error', err);
    return [];
  }
}

function writeAll(entries: LexiconEntry[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch (err) {
    console.error('[edoLexiconStore] writeAll error', err);
  }
}

export function lookupByWord(word: string): LexiconEntry | null {
  if (!word) return null;
  const entries = readAll();
  const w = word.trim().toLowerCase();
  for (const e of entries) {
    if (String(e.word || '').toLowerCase() === w) return e;
    const variants = e.spellingVariants || [];
    if (variants.map(v => String(v).toLowerCase()).includes(w)) return e;
  }
  return null;
}

export function searchByEnglish(term: string): LexiconEntry[] {
  if (!term) return [];
  const entries = readAll();
  const t = term.trim().toLowerCase();
  return entries.filter(e => String(e.englishMeaning || '').toLowerCase().includes(t));
}

export function listRecent(limit = 50): LexiconEntry[] {
  const entries = readAll();
  return entries
    .slice()
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
    .slice(0, limit);
}

export function listApproved(limit = 50): LexiconEntry[] {
  const entries = readAll();
  return entries
    .filter(entry => (entry.trainerApproval || 'draft') === 'approved')
    .slice()
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
    .slice(0, limit);
}

export function addEntry(partial: Partial<LexiconEntry>): LexiconEntry {
  const entries = readAll();
  const now = new Date().toISOString();
  const entry: LexiconEntry = {
    id: partial.id || `edo-${uuidv4()}`,
    word: (partial.word || '').trim(),
    spellingVariants: partial.spellingVariants || [],
    englishMeaning: partial.englishMeaning || '',
    edoMeaning: partial.edoMeaning || '',
    grammaticalCategory: partial.grammaticalCategory || '',
    examples: partial.examples || [],
    source: partial.source || 'user-submitted',
    confidence: partial.confidence || 0.0,
    trainerApproval: (partial.trainerApproval as any) || 'draft',
    createdAt: now,
    updatedAt: now,
  };
  entries.push(entry);
  writeAll(entries);
  return entry;
}

export function updateEntry(id: string, patch: Partial<LexiconEntry>): LexiconEntry | null {
  const entries = readAll();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;
  const updated: LexiconEntry = { ...entries[idx], ...patch, updatedAt: new Date().toISOString() };
  entries[idx] = updated;
  writeAll(entries);
  return updated;
}

export function deleteEntry(id: string): boolean {
  const entries = readAll();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  writeAll(entries);
  return true;
}

export function countEntries(): number {
  return readAll().length;
}
