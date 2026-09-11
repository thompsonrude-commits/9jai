export type LexiconEntry = {
  id: string;
  word: string;
  spellingVariants?: string[];
  englishMeaning?: string;
  edoMeaning?: string;
  grammaticalCategory?: string;
  examples?: string[];
  source?: string;
  confidence?: number;
  trainerApproval?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function lookupWord(word: string): Promise<LexiconEntry | null> {
  if (!word) return null;
  const qs = new URLSearchParams({ q: word });
  const res = await fetch(`/api/v1/edo/lexicon?${qs.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.success) return null;
  return data.data || null;
}

export async function searchEnglish(term: string): Promise<LexiconEntry[]> {
  if (!term) return [];
  const qs = new URLSearchParams({ q: term });
  const res = await fetch(`/api/v1/edo/lexicon?${qs.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.success) return [];
  return Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
}

export async function listRecent(limit = 50): Promise<LexiconEntry[]> {
  const res = await fetch(`/api/v1/edo/lexicon`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.success) return [];
  return Array.isArray(data.data) ? data.data : [];
}

export async function addEntry(entry: Partial<LexiconEntry>): Promise<LexiconEntry | null> {
  const res = await fetch(`/api/v1/edo/lexicon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.success) return null;
  return data.data || null;
}
