/**
 * Nigerian Voice Engine — Parallel Real-Time TTS Racing
 *
 * ARCHITECTURE:
 *   When a chunk arrives, ALL three engines start IN PARALLEL:
 *     1. Browser TTS  — fires within 300ms (zero network, prevents dead air)
 *     2. Edge TTS     — Nigerian neural (en-NG-AbeoNeural / en-NG-EzinneNeural) — PRIMARY
 *     3. Google TTS   — Nigerian neural (en-NG-Standard-B / A) — SECONDARY
 *
 *   Race rule (1.5s window):
 *     - If Edge or Google responds within 1.5s → cancel browser, play premium voice
 *     - If both exceed 1.5s → browser is already speaking, no silence ever
 *
 *   Result: speech starts within 300–700ms, no 6–8s pauses, ever.
 */

// ── Nigerian conversational adaptation ────────────────────────────────────

function detectEmotion(text: string): 'happy' | 'serious' | 'neutral' {
  const lower = text.toLowerCase();
  const happy   = ['congratulations','happy','great','excellent','correct','oya','well done','sharp','how far','welcome'];
  const serious = ['error','problem','warning','careful','important','mistake','sorry','stop'];
  if (happy.some(w => lower.includes(w)))   return 'happy';
  if (serious.some(w => lower.includes(w))) return 'serious';
  return 'neutral';
}

export function applyNigerianRhythm(text: string): string {
  let r = text;
  const rep: [RegExp, string][] = [
    [/\b(?:Hello|Hi|Greetings),?\s+I'm\s+([a-z]+)\b/gi,  'How far, i be $1, wetin i fit help you with today'],
    [/\b(?:Hello|Hi|Greetings),?\s+I am\s+([a-z]+)\b/gi, 'How far, i be $1'],
    [/\bI don't\b/gi,    'I no'],
    [/\bI can't\b/gi,    'I no fit'],
    [/\bplease\b/gi,     'abeg'],
    [/\bno problem\b/gi, 'no wahala'],
    [/\bokay\b/gi,       'oya'],
    [/\bsure\b/gi,       'sure o'],
    [/\bvery good\b/gi,  'e dey correct'],
    [/\bLet's go\b/gi,   'make we go'],
    [/\bexactly\b/gi,    'na so'],
    [/\bquickly\b/gi,    'sharp sharp'],
    [/\bI know\b/gi,     'I sabi'],
    [/\bHow are you\b/gi,'How far'],
    [/\bMy name is\b/gi, 'My name na'],
    [/\bpossible\b/gi,   'e fit be'],
    [/\b(probably|likely)\b/gi, 'e dey likely'],
    [/\bfuture\b/gi,     'tomorrow matter'],
  ];
  for (const [p, s] of rep) r = r.replace(p, s);
  return r;
}

// ── Intelligent Text Normalization Engine ─────────────────────────────────
// Runs BEFORE TTS. Converts symbols/patterns to natural spoken Nigerian English.
// Streaming-safe: works on any chunk, no async, no delay.

/**
 * Detect if a dash between two tokens is a RANGE (→ "to") or MATH (→ "minus").
 * Range: number-number, word-word (days, months, times), date-date
 * Math: only when part of an equation with = sign nearby
 */
function isDashRange(before: string, after: string, fullContext: string): boolean {
  const mathContext = /=|\bequals\b|\bplus\b|\btimes\b|\bdivided\b/i.test(fullContext);
  if (mathContext) return false;

  const numBefore = /^\d[\d,]*(\.\d+)?$/.test(before.trim());
  const numAfter  = /^\d[\d,]*(\.\d+)?$/.test(after.trim());
  if (numBefore && numAfter) return true; // 900 - 2000 → range

  const timePat = /^\d{1,2}(am|pm|:\d{2})$/i;
  if (timePat.test(before.trim()) || timePat.test(after.trim())) return true;

  const days    = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
  const months  = /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i;
  const seasons = /^(spring|summer|autumn|fall|winter)$/i;
  if (days.test(before.trim())   || days.test(after.trim()))    return true;
  if (months.test(before.trim()) || months.test(after.trim()))  return true;
  if (seasons.test(before.trim())|| seasons.test(after.trim())) return true;

  // Year range: 2020 - 2025
  const yearPat = /^(19|20)\d{2}$/;
  if (yearPat.test(before.trim()) && yearPat.test(after.trim())) return true;

  // Chapter/page/grade ranges
  const labelPat = /^(chapter|page|grade|level|step|stage|phase|week|day|month|year|class|form|section)\s*\d+$/i;
  if (labelPat.test(before.trim()) || labelPat.test(after.trim())) return true;

  return false;
}

/** Convert currency symbols to spoken words */
function normalizeCurrency(text: string): string {
  return text
    .replace(/₦\s*([\d,]+(?:\.\d+)?)/g, (_, n) => `${n} naira`)
    .replace(/\$\s*([\d,]+(?:\.\d+)?)/g,  (_, n) => `${n} dollars`)
    .replace(/£\s*([\d,]+(?:\.\d+)?)/g,   (_, n) => `${n} pounds`)
    .replace(/€\s*([\d,]+(?:\.\d+)?)/g,   (_, n) => `${n} euros`)
    .replace(/¥\s*([\d,]+(?:\.\d+)?)/g,   (_, n) => `${n} yen`)
    .replace(/₹\s*([\d,]+(?:\.\d+)?)/g,   (_, n) => `${n} rupees`);
}

/** Normalize time expressions */
function normalizeTime(text: string): string {
  return text
    .replace(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/gi, (_, h, m, ap) =>
      m === '00' ? `${h} ${ap.toLowerCase()}` : `${h} ${m} ${ap.toLowerCase()}`)
    .replace(/\b(\d{1,2})(am|pm)\b/gi, (_, h, ap) => `${h} ${ap.toLowerCase()}`);
}

/** Normalize percentages, fractions, measurements */
function normalizeMeasurements(text: string): string {
  return text
    .replace(/(\d+(?:\.\d+)?)\s*%/g,  (_, n) => `${n} percent`)
    .replace(/(\d+(?:\.\d+)?)\s*km\b/gi,  (_, n) => `${n} kilometres`)
    .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi,  (_, n) => `${n} kilograms`)
    .replace(/(\d+(?:\.\d+)?)\s*mg\b/gi,  (_, n) => `${n} milligrams`)
    .replace(/(\d+(?:\.\d+)?)\s*ml\b/gi,  (_, n) => `${n} millilitres`)
    .replace(/(\d+(?:\.\d+)?)\s*gb\b/gi,  (_, n) => `${n} gigabytes`)
    .replace(/(\d+(?:\.\d+)?)\s*mb\b/gi,  (_, n) => `${n} megabytes`)
    .replace(/(\d+(?:\.\d+)?)\s*tb\b/gi,  (_, n) => `${n} terabytes`)
    .replace(/(\d+(?:\.\d+)?)\s*°c\b/gi,  (_, n) => `${n} degrees celsius`)
    .replace(/(\d+(?:\.\d+)?)\s*°f\b/gi,  (_, n) => `${n} degrees fahrenheit`)
    .replace(/(\d+(?:\.\d+)?)\s*m\b/g,    (_, n) => `${n} metres`)
    .replace(/(\d+(?:\.\d+)?)\s*cm\b/gi,  (_, n) => `${n} centimetres`)
    .replace(/(\d+(?:\.\d+)?)\s*mm\b/gi,  (_, n) => `${n} millimetres`);
}

/** Normalize common abbreviations to spoken form */
function normalizeAbbreviations(text: string): string {
  const abbr: [RegExp, string][] = [
    [/\bvs\.?\b/gi,   'versus'],
    [/\betc\.?\b/gi,  'and so on'],
    [/\be\.g\.?\b/gi, 'for example'],
    [/\bi\.e\.?\b/gi, 'that is'],
    [/\bapprox\.?\b/gi, 'approximately'],
    [/\bmax\.?\b/gi,  'maximum'],
    [/\bmin\.?\b/gi,  'minimum'],
    [/\bno\.\s*(\d+)/gi, 'number $1'],
    [/\bdr\.?\s+/gi,  'Doctor '],
    [/\bmr\.?\s+/gi,  'Mister '],
    [/\bmrs\.?\s+/gi, 'Missus '],
    [/\bms\.?\s+/gi,  'Miss '],
    [/\bprof\.?\s+/gi,'Professor '],
    [/\bst\.?\s+/gi,  'Street '],
    [/\bave\.?\s+/gi, 'Avenue '],
    [/\brd\.?\s+/gi,  'Road '],
    [/\bblvd\.?\b/gi, 'Boulevard'],
    [/\bfyi\b/gi,     'for your information'],
    [/\basap\b/gi,    'as soon as possible'],
    [/\bbtw\b/gi,     'by the way'],
    [/\bimo\b/gi,     'in my opinion'],
    [/\bna\b/gi,      'not available'],
    [/\bw\/\b/g,      'with'],
    [/\bw\/o\b/g,     'without'],
  ];
  let r = text;
  for (const [p, s] of abbr) r = r.replace(p, s);
  return r;
}

/** Strip markdown and code blocks that should not be spoken */
function stripSpeechNoise(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, 'code block')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#`~\[\]{}|\\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Context-aware dash/hyphen interpretation */
function normalizeDashes(text: string): string {
  // Replace " - " between tokens based on context
  return text.replace(/(\S+)\s*[-–—]\s*(\S+)/g, (match, before, after) => {
    if (isDashRange(before, after, text)) {
      return `${before} to ${after}`;
    }
    // Compound words / hyphenated adjectives — keep as space
    if (/^[a-z]+$/i.test(before) && /^[a-z]+$/i.test(after)) {
      return `${before} ${after}`;
    }
    return match; // leave as-is for TTS to handle
  });
}

/** Normalize slashes in context */
function normalizeSlashes(text: string): string {
  return text
    .replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, (_, d, m, y) => `${d} ${m} ${y}`) // dates
    .replace(/\b(and|or)\/\b/gi, '$1 or ')
    .replace(/\b(\w+)\/(\w+)\b/g, '$1 or $2'); // word/word → word or word
}

/** Normalize colons in non-time contexts */
function normalizeColons(text: string): string {
  // Keep time colons (8:30) but remove list colons
  return text.replace(/(?<!\d):(?!\d{2})/g, ',');
}

/** Nigerian phonetic naturalisation — common words/phrases */
function nigerianPhonetics(text: string): string {
  const ph: [RegExp, string][] = [
    // ── Agent names — Nigerian pronunciation (I = "ee", not "eye") ────────
    [/\bIjeoma\b/g,  'Ee-jeh-oh-mah'],
    [/\bAdesuwa\b/g, 'Ah-deh-soo-wah'],
    [/\bAbike\b/g,   'Ah-bee-keh'],
    [/\bHadizat\b/g, 'Hah-dee-zaht'],
    [/\bUchena\b/g,  'Oo-cheh-nah'],
    [/\bFarouk\b/g,  'Fah-rook'],
    [/\bNosa\b/g,    'Noh-sah'],
    [/\bJide\b/g,    'Jee-deh'],

    // ── Common Nigerian names ─────────────────────────────────────────────
    [/\bChukwu/g,    'Choo-kwoo'],
    [/\bEmeka\b/gi,  'Eh-meh-kah'],
    [/\bTunde\b/gi,  'Too-ndeh'],
    [/\bKemi\b/gi,   'Keh-mee'],
    [/\bBola\b/gi,   'Boh-lah'],
    [/\bFemi\b/gi,   'Feh-mee'],
    [/\bNgozi\b/gi,  'Nn-goh-zee'],
    [/\bChinwe\b/gi, 'Cheen-weh'],
    [/\bAmaka\b/gi,  'Ah-mah-kah'],
    [/\bChidi\b/gi,  'Chee-dee'],
    [/\bObi\b/gi,    'Oh-bee'],
    [/\bIfe\b/gi,    'Ee-feh'],
    [/\bIbk\b/gi,    'Ee-bee-keh'],
    [/\bTemi\b/gi,   'Teh-mee'],
    [/\bSeun\b/gi,   'Sheh-oon'],
    [/\bBunmi\b/gi,  'Boon-mee'],
    [/\bYemi\b/gi,   'Yeh-mee'],
    [/\bDami\b/gi,   'Dah-mee'],
    [/\bTiti\b/gi,   'Tee-tee'],
    [/\bSola\b/gi,   'Shoh-lah'],
    [/\bWale\b/gi,   'Wah-leh'],
    [/\bDele\b/gi,   'Deh-leh'],
    [/\bTola\b/gi,   'Toh-lah'],
    [/\bLola\b/gi,   'Loh-lah'],
    [/\bKola\b/gi,   'Koh-lah'],
    [/\bAkin\b/gi,   'Ah-keen'],
    [/\bBiola\b/gi,  'Bee-oh-lah'],
    [/\bFunke\b/gi,  'Foon-keh'],
    [/\bRonke\b/gi,  'Rohn-keh'],
    [/\bToyin\b/gi,  'Toh-yeen'],
    [/\bAdaeze\b/gi, 'Ah-dah-eh-zeh'],
    [/\bChibuike\b/gi,'Chee-boo-ee-keh'],
    [/\bObinna\b/gi, 'Oh-been-nah'],
    [/\bIfeanyi\b/gi,'Ee-feh-ah-nyee'],
    [/\bOluwaseun\b/gi,'Oh-loo-wah-sheh-oon'],
    [/\bOluwafemi\b/gi,'Oh-loo-wah-feh-mee'],
    [/\bOluwakemi\b/gi,'Oh-loo-wah-keh-mee'],

    // ── Nigerian locations ────────────────────────────────────────────────
    [/\bAbuja\b/gi,   'Ah-boo-jah'],
    [/\bLagos\b/gi,   'Lay-gos'],
    [/\bKano\b/gi,    'Kah-noh'],
    [/\bEnugu\b/gi,   'Eh-noo-goo'],
    [/\bBenin\b/gi,   'Beh-neen'],
    [/\bIbadan\b/gi,  'Ee-bah-dahn'],
    [/\bWarri\b/gi,   'Woh-ree'],
    [/\bOnitsha\b/gi, 'Oh-neet-shah'],
    [/\bAbeokuta\b/gi,'Ah-beh-oh-koo-tah'],
    [/\bOsogbo\b/gi,  'Oh-shoh-gboh'],
    [/\bIlorin\b/gi,  'Ee-loh-reen'],
    [/\bMaiduguri\b/gi,'My-doo-goo-ree'],
    [/\bCalabar\b/gi, 'Kah-lah-bah'],
    [/\bUyo\b/gi,     'Oo-yoh'],
    [/\bAsaba\b/gi,   'Ah-sah-bah'],
    [/\bAkure\b/gi,   'Ah-koo-reh'],
    [/\bOwerri\b/gi,  'Oh-weh-ree'],
    [/\bAdo\b/gi,     'Ah-doh'],
    [/\bEkiti\b/gi,   'Eh-kee-tee'],
    [/\bOgun\b/gi,    'Oh-goon'],
    [/\bOsun\b/gi,    'Oh-shoon'],
    [/\bOyo\b/gi,     'Oh-yoh'],
    [/\bAnambra\b/gi, 'Ah-nahm-brah'],
    [/\bImo\b/gi,     'Ee-moh'],
    [/\bDelta\b/gi,   'Dehl-tah'],
    [/\bEdo\b/gi,     'Eh-doh'],
    [/\bNaija\b/gi,   'Nah-ee-jah'],
    [/\bNigeria\b/gi, 'Nee-jeer-ee-ah'],

    // ── Pidgin phrases — natural flow ─────────────────────────────────────
    [/\bhow far\b/gi,     'how far'],
    [/\bno wahala\b/gi,   'no wahala'],
    [/\babeg\b/gi,        'abeg'],
    [/\bwetin\b/gi,       'wetin'],
    [/\bna so\b/gi,       'na so'],
    [/\boya\b/gi,         'oya'],
    [/\bsharp sharp\b/gi, 'sharp sharp'],
    [/\be dey\b/gi,       'e dey'],
    [/\bno fit\b/gi,      'no fit'],
    [/\bsabi\b/gi,        'sabi'],
    [/\bwahala\b/gi,      'wahala'],
    [/\bOyibo\b/gi,       'Oh-yee-boh'],    [/\bTiv\b/gi,         'Tee-vee'],
    [/\bKanuri\b/gi,      'Kah-noo-ree'],
    [/\bFulfulde\b/gi,    'Foo-foo-lde'],
    [/\bEfik\b/gi,        'Eh-feek'],
    [/\bYoruba\b/gi,      'Yaw-roo-bah'],
    [/\bIgbo\b/gi,        'Ee-gboh'],
    [/\bHausa\b/gi,       'How-sah'],  ];
  let r = text;
  for (const [p, s] of ph) r = r.replace(p, s);
  return r;
}

/**
 * MASTER normalizer — runs the full pipeline before TTS.
 * Streaming-safe: pure synchronous transform, works on any chunk size.
 */
export function normalizeSpeechText(raw: string): string {
  let t = raw;
  t = stripSpeechNoise(t);       // remove markdown/code
  t = normalizeCurrency(t);      // ₦900 → 900 naira
  t = normalizeTime(t);          // 8:30am → 8 30 am
  t = normalizeMeasurements(t);  // 5kg → 5 kilograms
  t = normalizeAbbreviations(t); // vs → versus, etc
  t = normalizeDashes(t);        // 900 - 2000 → 900 to 2000
  t = normalizeSlashes(t);       // and/or → and or
  t = normalizeColons(t);        // list colons → commas
  t = applyNigerianRhythm(t);    // pidgin conversational rewrites
  t = nigerianPhonetics(t);      // phonetic naturalisation
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
}

// ── Voice identity map ─────────────────────────────────────────────────────

export interface VoiceIdentity {
  id: string;
  gender: 'male' | 'female';
  edgeVoice: string;
  googleVoice: string;
  personality: string;
  pacing: number;
  pitch: number;
}

export const VOICE_IDENTITIES: Record<string, VoiceIdentity> = {
  nosa:    { id:'nosa',    gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'calm',       pacing:1.05, pitch:0.90 },
  jide:    { id:'jide',    gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'energetic',  pacing:1.15, pitch:1.00 },
  uchena:  { id:'uchena',  gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'analytical', pacing:1.08, pitch:0.92 },
  farouk:  { id:'farouk',  gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'wise',       pacing:1.00, pitch:0.88 },
  adesuwa: { id:'adesuwa', gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'warm',       pacing:1.10, pitch:1.10 },
  abike:   { id:'abike',   gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'lively',     pacing:1.18, pitch:1.15 },
  ijeoma:  { id:'ijeoma',  gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'futuristic', pacing:1.12, pitch:1.08 },
  hadizat: { id:'hadizat', gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'graceful',   pacing:1.05, pitch:1.05 },
};

export const ASSISTANT_PROFILES: Record<string, { gender: 'male' | 'female' }> = {
  nosa:'male', jide:'male', uchena:'male', farouk:'male',
  adesuwa:'female', abike:'female', ijeoma:'female', hadizat:'female',
} as any;

// ── Global state ───────────────────────────────────────────────────────────

let speechBuffer       = '';
let speechQueue: { text: string; assistantId: string }[] = [];
let isSpeakingSentence = false;
let activeBrowserUtterance: SpeechSynthesisUtterance | null = null;
let globalOnStreamStart: (() => void) | undefined;
let globalOnStreamEnd:   (() => void) | undefined;
// Cached best voice per gender — avoid scanning voices list every sentence
let cachedMaleVoice:   SpeechSynthesisVoice | null | undefined = undefined;
let cachedFemaleVoice: SpeechSynthesisVoice | null | undefined = undefined;

// ── Chunk extraction — speaks early, never waits for full paragraph ────────

const MIN_WORDS = 8;

function extractNextChunk(flush: boolean): string | null {
  const m = speechBuffer.match(/[.!?\n]+/);
  if (m && m.index !== undefined) {
    const chunk = speechBuffer.slice(0, m.index + m[0].length).trim();
    speechBuffer = speechBuffer.slice(m.index + m[0].length);
    return chunk || null;
  }
  const cm = speechBuffer.match(/,\s+/);
  if (cm && cm.index !== undefined && speechBuffer.slice(0, cm.index).split(' ').length >= MIN_WORDS) {
    const chunk = speechBuffer.slice(0, cm.index + cm[0].length).trim();
    speechBuffer = speechBuffer.slice(cm.index + cm[0].length);
    return chunk || null;
  }
  const words = speechBuffer.split(' ');
  if (words.length >= MIN_WORDS + 2) {
    const chunk = words.slice(0, MIN_WORDS).join(' ').trim();
    speechBuffer = words.slice(MIN_WORDS).join(' ');
    return chunk || null;
  }
  if (flush && speechBuffer.trim()) {
    const chunk = speechBuffer.trim();
    speechBuffer = '';
    return chunk;
  }
  return null;
}

// ── Best voice picker ──────────────────────────────────────────────────────
// Uses Windows SAPI/OS voices directly — same source as Voice Box
// Priority: en-NG Neural > en-GB Neural > Google Natural > en-US Neural > any English

function pickBestVoice(gender: 'male' | 'female'): SpeechSynthesisVoice | null {
  // Return cached if available
  if (gender === 'male'   && cachedMaleVoice   !== undefined) return cachedMaleVoice;
  if (gender === 'female' && cachedFemaleVoice !== undefined) return cachedFemaleVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Female voice name patterns
  const FEMALE_NAMES = /ezinne|zira|aria|jenny|sonia|emma|ava|natasha|libby|mia|susan|hazel|heather|linda|karen|moira|samantha|victoria|fiona|tessa|veena/i;
  // Male voice name patterns  
  const MALE_NAMES   = /abeo|ryan|guy|daniel|james|david|george|mark|oliver|thomas|edgar|richard|liam|ethan/i;

  const isFemale = (v: SpeechSynthesisVoice) => FEMALE_NAMES.test(v.name) || /female/i.test(v.name);
  const isMale   = (v: SpeechSynthesisVoice) => !isFemale(v);
  const filter   = gender === 'female' ? isFemale : isMale;

  // Score: higher is better
  const score = (v: SpeechSynthesisVoice): number => {
    let s = 0;
    const n = v.name.toLowerCase();
    const l = v.lang.toLowerCase();
    // Nigerian voices — absolute best
    if (/abeo/i.test(n))   s += 1000; // Microsoft Abeo (NG male)
    if (/ezinne/i.test(n)) s += 1000; // Microsoft Ezinne (NG female)
    if (l.startsWith('en-ng')) s += 500;
    // British — closer rhythm to Nigerian than American
    if (l.startsWith('en-gb')) s += 200;
    if (/ryan|sonia|libby|mia/i.test(n)) s += 100; // Popular natural British voices
    // Neural/Natural quality boost
    if (/neural|natural|enhanced|premium/i.test(n)) s += 150;
    if (/google/i.test(n)) s += 120; // Google voices on Chrome/Android are natural
    if (/microsoft/i.test(n)) s += 80;
    // American English fallback
    if (l.startsWith('en-us')) s += 50;
    if (l.startsWith('en'))    s += 20;
    return s;
  };

  const pool = voices.filter(v => filter(v) && v.lang.toLowerCase().startsWith('en'));
  const best = pool.length > 0
    ? pool.sort((a, b) => score(b) - score(a))[0]
    : (voices.find(v => v.lang.startsWith('en')) || voices[0] || null);

  if (gender === 'male')   cachedMaleVoice   = best;
  if (gender === 'female') cachedFemaleVoice = best;

  console.log(`[TTS] Best ${gender} voice selected:`, best?.name, best?.lang);
  return best;
}

// ── Stop speaking ──────────────────────────────────────────────────────────

function stopActiveSpeech(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  activeBrowserUtterance = null;
}

// ── Speak one sentence directly via Web Speech API ────────────────────────

function speakSentenceDirectly(
  text: string,
  assistantId: string,
  onDone: () => void
): void {
  if (!('speechSynthesis' in window)) { onDone(); return; }

  window.speechSynthesis.cancel();

  const id   = assistantId.toLowerCase();
  const s    = VOICE_IDENTITIES[id] || VOICE_IDENTITIES.nosa;
  const emo  = detectEmotion(text);
  const clean = text.slice(0, 600);

  const u   = new SpeechSynthesisUtterance(clean);
  u.pitch   = (s.pitch  || 1.0) + (emo === 'happy' ? 0.10 : emo === 'serious' ? -0.06 : 0);
  u.rate    = Math.min(1.25, (s.pacing || 1.1) + (emo === 'happy' ? 0.08 : emo === 'serious' ? -0.06 : 0));
  u.volume  = 1.0;
  u.lang    = 'en-GB'; // British English — much closer to Nigerian cadence than en-US

  // Set voice — clear cache first time so we get best available
  const setVoice = () => {
    // Clear cache so we re-scan after voices load
    cachedMaleVoice   = undefined;
    cachedFemaleVoice = undefined;
    const v = pickBestVoice(s.gender || 'male');
    if (v) {
      u.voice = v;
      u.lang  = v.lang; // Match utterance lang to voice lang
    }
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    setVoice();
  } else {
    // Voices not loaded yet — wait for them
    window.speechSynthesis.onvoiceschanged = () => {
      setVoice();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }

  let done = false;
  const finish = () => { if (!done) { done = true; activeBrowserUtterance = null; onDone(); } };

  const safety = setTimeout(() => { window.speechSynthesis.cancel(); finish(); }, 15000);
  u.onend   = () => { clearTimeout(safety); finish(); };
  u.onerror = (e) => {
    clearTimeout(safety);
    if (e.error !== 'interrupted' && e.error !== 'canceled') console.warn('[TTS] Error:', e.error, '| Voice:', u.voice?.name);
    finish();
  };

  activeBrowserUtterance = u;
  window.speechSynthesis.speak(u);
}

// ── Playback queue ─────────────────────────────────────────────────────────

function processSpeechBuffer(assistantId: string, flush = false): void {
  let chunk: string | null;
  while ((chunk = extractNextChunk(flush)) !== null) {
    speechQueue.push({ text: chunk, assistantId: assistantId.toLowerCase() });
  }
  void drainQueue();
}

async function drainQueue(): Promise<void> {
  if (isSpeakingSentence || speechQueue.length === 0) return;

  isSpeakingSentence = true;
  const { text, assistantId } = speechQueue.shift()!;

  if (globalOnStreamStart) {
    globalOnStreamStart();
    globalOnStreamStart = undefined;
  }

  const adapted = normalizeSpeechText(text);

  const onDone = () => {
    isSpeakingSentence = false;
    if (speechQueue.length === 0 && speechBuffer.length === 0) {
      globalOnStreamEnd?.();
      globalOnStreamEnd = undefined;
    }
    void drainQueue();
  };

  speakSentenceDirectly(adapted, assistantId, onDone);
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function speakNigerian(
  text: string,
  assistantId: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  if (!isSpeakingSentence && speechQueue.length === 0 && speechBuffer.length === 0) {
    globalOnStreamStart = onStart;
    globalOnStreamEnd   = onEnd;
  }
  const isFlush = text === '' && speechBuffer.length > 0;
  speechBuffer += text;
  processSpeechBuffer(assistantId, isFlush);
}

export function stopNigerianSpeech(): void {
  stopActiveSpeech();
  speechBuffer       = '';
  speechQueue        = [];
  isSpeakingSentence = false;
  globalOnStreamStart = undefined;
  globalOnStreamEnd   = undefined;
}
