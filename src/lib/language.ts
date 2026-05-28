// Use dynamic imports for language libraries to avoid bundling CJS-only modules

const PSEUDO_KEYWORDS: Record<string, string[]> = {
  pcm: ['how far', 'how yu dey', 'abeg', 'naija', 'i dey'],
  yo: ['bawo', 'se dada', 'e nle', 'owo', 'omo'],
  ig: ['kedu', 'onye', 'nno', 'dalu', 'biko'],
  ha: ['sannu', 'yaya', 'lafiya', 'na gode', 'kasuwa'],
  swa: ['habari', 'asante', 'siku', 'jambo'],
  edo: ['kọyo', 'koyo', 'obokhian', 'obokhe', 'ob\'awie', 'uru ese', 'ma rrie', 'ob\'avan'],
};

export async function detectLanguage(text: string): Promise<{ code: string; name: string; reliable: boolean; confidence: number }> {
  const trimmed = (text || '').trim();
  if (!trimmed) return { code: 'en', name: 'English', reliable: false };

  const lc = trimmed.toLowerCase();
    const lcNorm = lc.normalize && lc.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || lc;
  for (const [code, kws] of Object.entries(PSEUDO_KEYWORDS)) {
    for (const k of kws) {
      if (!k) continue;
      const kn = (k || '').toLowerCase();
        const knNorm = kn.normalize && kn.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || kn;
      if (lc.includes(kn) || lcNorm.includes(knNorm)) {
        const nameGuess = mapCodeToName(code);
        return { code, name: nameGuess, reliable: true, confidence: 0.95 };
      }
    }
  }

  try {
    const francModule: any = await import('franc');
    const langsModule: any = await import('langs');
    const francFn: any = francModule.default || francModule;
    const francCode = francFn(trimmed, { minLength: 3 });
    if (francCode && francCode !== 'und') {
      const info: any = langsModule.where('3', francCode) || langsModule.where('1', francCode);
      if (info) return { code: info['1'] || info['2'] || info['3'], name: info.name, reliable: true, confidence: 0.85 };
    }
  } catch (e) {
    // fallback — dynamic import not available or modules incompatible in runtime
  }

  return { code: 'en', name: 'English', reliable: false, confidence: 0.4 };
}

export function mapCodeToName(code: string): string {
  try {
    // Prefer simple mapping for common codes to avoid bundling `langs` at top-level
    const M: Record<string, string> = {
      pcm: 'Nigerian Pidgin', yo: 'Yoruba', ig: 'Igbo', ha: 'Hausa', edo: 'Edo', efk: 'Efik', tiv: 'Tiv', fuv: 'Fulfulde', kan: 'Kanuri', sw: 'Swahili'
    };
    return M[code] || code;
  } catch {
    return code;
  }
}

export function getConversationLanguage(): string | null {
  try { return localStorage.getItem('conversation_language'); } catch { return null; }
}

export function setConversationLanguage(code: string) {
  try { localStorage.setItem('conversation_language', code); } catch { /* ignore */ }
}
