export interface PhoneticResult {
  ipa: string;
  syllables: string[];
  hint: string; // human-friendly pronunciation
  language: string;
}

const PIDGIN_DICTIONARY: Record<string, string> = {
  'how far': 'hau faː',
  'wetin dey happen': 'weh-tin dey hap-pen',
  'abeg': 'ah-beg',
  'i dey': 'ai dey',
};

const SIMPLE_IPA_MAP: Record<string, string> = {
  'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
};

function syllabifySimple(word: string): string[] {
  // naive syllable split: vowel-centered chunks
  const parts: string[] = [];
  const re = /[^aeiouy]*[aeiouy]+[^aeiouy]*/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(word)) !== null) parts.push(m[0]);
  if (parts.length === 0) parts.push(word);
  return parts;
}

function toLatinHint(words: string, lang: string): string {
  const lower = words.toLowerCase();
  if (lang === 'pcm') {
    for (const k of Object.keys(PIDGIN_DICTIONARY)) {
      if (lower.includes(k)) return PIDGIN_DICTIONARY[k];
    }
  }

  // Fallback: return a simple spaced syllable approximation
  const tokens = words.split(/\s+/).map(w => {
    const clean = w.replace(/[^\p{L}'-]/gu, '');
    const s = syllabifySimple(clean).join('-');
    return s || clean;
  });
  return tokens.join(' ');
}

function toIPAApprox(words: string, lang: string): string {
  // Very lightweight IPA approximation for display purposes only
  if (lang === 'pcm') {
    return words.split(/\s+/).map(w => w.replace(/a/g, 'a').replace(/e/g, 'e').replace(/o/g, 'o')).join(' ');
  }
  // Yoruba / Igbo tonal hints: preserve diacritics as combining markers
  if (lang === 'yo' || lang === 'ig') {
    // mark acute (high) with '˦' and grave (low) with '˨' in a simple way
    return words.normalize('NFD').replace(/\u0301/g, '˦').replace(/\u0300/g, '˨');
  }
  return words;
}

export function generatePhonetics(text: string, lang?: string): PhoneticResult {
  const code = (lang || 'en').toLowerCase();
  const hint = toLatinHint(text, code);
  const ipa = toIPAApprox(text, code);
  const syllables = text.split(/\s+/).map(w => syllabifySimple(w.toLowerCase()));
  const flat = ([] as string[]).concat(...syllables);

  return {
    ipa: ipa,
    syllables: flat,
    hint,
    language: code,
  };
}

// Small utility: produce an instruction snippet for agents
export function pronunciationInstruction(word: string, lang?: string): string {
  const p = generatePhonetics(word, lang);
  return `Pronunciation: ${p.hint} — syllables: ${p.syllables.join(' - ')} — IPA (approx): ${p.ipa}`;
}
