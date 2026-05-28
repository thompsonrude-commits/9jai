(async () => {
  // Lightweight smoke test for language detection
  const PSEUDO_KEYWORDS = {
    pcm: ['how far', 'how yu dey', 'abeg', 'naija', 'i dey'],
    yo: ['bawo', 'se dada', 'e nle', 'owo', 'omo'],
    ig: ['kedu', 'onye', 'nno', 'dalu', 'biko'],
    ha: ['sannu', 'yaya', 'lafiya', 'na gode', 'kasuwa'],
    swa: ['habari', 'asante', 'siku', 'jambo'],
    edo: ['kọyo', 'koyo', 'obokhian', 'obokhe', "ob'awie", 'uru ese', 'ma rrie', "ob'avan"],
  };

  function mapCodeToName(code) {
    const M = { pcm: 'Nigerian Pidgin', yo: 'Yoruba', ig: 'Igbo', ha: 'Hausa', edo: 'Edo', efk: 'Efik', tiv: 'Tiv', fuv: 'Fulfulde', kan: 'Kanuri', sw: 'Swahili' };
    return M[code] || code;
  }

  async function detectLanguage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return { code: 'en', name: 'English', reliable: false, confidence: 0 };
    const lc = trimmed.toLowerCase();
    const lcNorm = lc.normalize && lc.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || lc;
    for (const [code, kws] of Object.entries(PSEUDO_KEYWORDS)) {
      for (const k of kws) {
        if (!k) continue;
        const kn = (k || '').toLowerCase();
        const knNorm = kn.normalize && kn.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || kn;
        if (lc.includes(kn) || lcNorm.includes(knNorm)) return { code, name: mapCodeToName(code), reliable: true, confidence: 0.95 };
      }
    }

    try {
      const francModule = await import('franc');
      const langsModule = await import('langs');
      const francFn = francModule.default || francModule;
      const francCode = francFn(trimmed, { minLength: 3 });
      if (francCode && francCode !== 'und') {
        const info = langsModule.where('3', francCode) || langsModule.where('1', francCode);
        if (info) return { code: info['1'] || info['2'] || info['3'], name: info.name, reliable: true, confidence: 0.85 };
      }
    } catch (e) {
      // ignore
    }

    return { code: 'en', name: 'English', reliable: false, confidence: 0.4 };
  }

  const samples = {
    pidgin: 'How far my guy, I dey come now abeg',
    yoruba: 'Bawo ni, se dada ni?',
    igbo: 'Kedu, kedu ka i mere?',
    hausa: 'Sannu, lafiya? Yaya aiki?',
    swahili: 'Habari gani, asante sana',
    edo: 'Kọyo, ma rrie',
    english: 'Hello, how are you doing today?',
    mixed: 'How far, kedu? I dey fine, thank you',
  };

  console.log('Running language detection smoke tests...');
  for (const [k, text] of Object.entries(samples)) {
    try {
      const res = await detectLanguage(text);
      console.log(`${k.padEnd(8)} | "${text}"\n  → code=${res.code}, name=${res.name}, reliable=${res.reliable}, confidence=${res.confidence}`);
    } catch (e) {
      console.error('Error on', k, e);
    }
  }
})();
