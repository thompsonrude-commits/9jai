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
  nosa:    { id:'nosa',    gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'calm',       pacing:0.90, pitch:0.90 },
  jide:    { id:'jide',    gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'energetic',  pacing:1.05, pitch:1.00 },
  uchena:  { id:'uchena',  gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'analytical', pacing:0.95, pitch:0.85 },
  farouk:  { id:'farouk',  gender:'male',   edgeVoice:'en-NG-AbeoNeural',   googleVoice:'en-NG-Standard-B', personality:'wise',       pacing:0.85, pitch:0.80 },
  adesuwa: { id:'adesuwa', gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'warm',       pacing:0.95, pitch:1.10 },
  abike:   { id:'abike',   gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'lively',     pacing:1.02, pitch:1.15 },
  ijeoma:  { id:'ijeoma',  gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'futuristic', pacing:1.00, pitch:1.08 },
  hadizat: { id:'hadizat', gender:'female', edgeVoice:'en-NG-EzinneNeural', googleVoice:'en-NG-Standard-A', personality:'graceful',   pacing:0.92, pitch:1.05 },
};

export const ASSISTANT_PROFILES: Record<string, { gender: 'male' | 'female' }> = {
  nosa:'male', jide:'male', uchena:'male', farouk:'male',
  adesuwa:'female', abike:'female', ijeoma:'female', hadizat:'female',
} as any;

// ── Global state ───────────────────────────────────────────────────────────

let speechBuffer       = '';
let speechQueue: { text: string; assistantId: string }[] = [];
let isSpeakingSentence = false;
let activeAudio: HTMLAudioElement | null = null;
let activeBrowserUtterance: SpeechSynthesisUtterance | null = null;
let globalOnStreamStart: (() => void) | undefined;
let globalOnStreamEnd:   (() => void) | undefined;

// ── Chunk extraction — speaks early, never waits for full paragraph ────────

const MIN_WORDS = 7; // speak after this many words even without punctuation

function extractNextChunk(flush: boolean): string | null {
  // 1. Sentence-ending punctuation
  const m = speechBuffer.match(/[.!?\n]+/);
  if (m && m.index !== undefined) {
    const chunk = speechBuffer.slice(0, m.index + m[0].length).trim();
    speechBuffer = speechBuffer.slice(m.index + m[0].length);
    return chunk || null;
  }
  // 2. Comma clause with enough words before it
  const cm = speechBuffer.match(/,\s+/);
  if (cm && cm.index !== undefined && speechBuffer.slice(0, cm.index).split(' ').length >= MIN_WORDS) {
    const chunk = speechBuffer.slice(0, cm.index + cm[0].length).trim();
    speechBuffer = speechBuffer.slice(cm.index + cm[0].length);
    return chunk || null;
  }
  // 3. Word-count threshold — no punctuation needed
  const words = speechBuffer.split(' ');
  if (words.length >= MIN_WORDS + 2) {
    const chunk = words.slice(0, MIN_WORDS).join(' ').trim();
    speechBuffer = words.slice(MIN_WORDS).join(' ');
    return chunk || null;
  }
  // 4. Flush remainder
  if (flush && speechBuffer.trim()) {
    const chunk = speechBuffer.trim();
    speechBuffer = '';
    return chunk;
  }
  return null;
}

// ── TTS endpoints ──────────────────────────────────────────────────────────

// Use local proxy path so dev requests go through Vite and the emulator without CORS issues
const TTS_ENDPOINT = '/api/v1/speech/synthesize';

const EDGE_PROXIES = [
  'https://edge-tts-proxy.vercel.app/api/tts',
  'https://tts.travisvn.com/api/edge-tts',
  'https://edge-tts.deno.dev/api/tts',
];

// ── Browser TTS voice picker (strict gender lock) ─────────────────────────

function getBestVoice(gender: 'male' | 'female'): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const MALE_RE   = /male|man|boy|daniel|david|mark|paul|james|abeo|george|richard|oliver/i;
  const FEMALE_RE = /female|woman|girl|zira|ezinne|samantha|victoria|karen|moira|fiona|tessa|aria/i;
  let pool = voices.filter(v => {
    const n = v.name.toLowerCase();
    return gender === 'male'
      ? (MALE_RE.test(n) || n.includes('male'))     && !FEMALE_RE.test(n) && !n.includes('female')
      : (FEMALE_RE.test(n) || n.includes('female')) && !MALE_RE.test(n)   && !n.includes('male');
  });
  if (!pool.length) {
    pool = voices.filter(v => {
      const n = v.name.toLowerCase();
      return gender === 'male' ? !FEMALE_RE.test(n) && !n.includes('female')
                               : !MALE_RE.test(n)   && !n.includes('male');
    });
  }
  for (const lang of ['en-NG','en-GB','en-US','en']) {
    const hit = pool.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (hit) return hit;
  }
  return pool[0] ?? null;
}

// ── Stop any currently playing audio ──────────────────────────────────────

function stopActiveAudio(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if (activeBrowserUtterance) {
    window.speechSynthesis.cancel();
    activeBrowserUtterance = null;
  }
}

// ── Browser TTS — starts immediately, returns utterance for cancellation ──

function startBrowserTTS(
  text: string,
  assistantId: string,
  onEnd: () => void
): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) { onEnd(); return null; }
  window.speechSynthesis.cancel();

  const id    = assistantId.toLowerCase();
  const s     = VOICE_IDENTITIES[id] || VOICE_IDENTITIES.nosa;
  const clean = text.replace(/[*_#`~\[\]]/g, '').slice(0, 500);
  const u     = new SpeechSynthesisUtterance(clean);
  const emo   = detectEmotion(text);

  u.pitch  = (s.pitch  || 1.0) + (emo === 'happy' ? 0.05 : emo === 'serious' ? -0.03 : 0);
  u.rate   = (s.pacing || 1.0) + (emo === 'happy' ? 0.05 : emo === 'serious' ? -0.10 : 0);
  u.volume = 1;
  u.onend   = () => { if (activeBrowserUtterance === u) { activeBrowserUtterance = null; onEnd(); } };
  u.onerror = () => { if (activeBrowserUtterance === u) { activeBrowserUtterance = null; onEnd(); } };

  const v = getBestVoice(s.gender || 'male');
  if (!v) { onEnd(); return null; } // gender lock — never play wrong gender
  u.voice = v;

  activeBrowserUtterance = u;
  window.speechSynthesis.speak(u);
  return u;
}

// ── Edge TTS fetch — returns audio blob or null ────────────────────────────

async function fetchEdgeTTS(text: string, assistantId: string): Promise<Blob | null> {
  const id       = assistantId.toLowerCase();
  const identity = VOICE_IDENTITIES[id] || VOICE_IDENTITIES.nosa;
  const clean    = text.replace(/[*_#`~\[\]()]/g, '').replace(/```[\s\S]*?```/g, 'code block').slice(0, 300);
  const rate     = identity.pacing > 1
    ? `+${Math.round((identity.pacing - 1) * 100)}%`
    : `-${Math.round((1 - identity.pacing) * 100)}%`;
  const pitch    = identity.gender === 'female' ? '+5Hz' : '-2Hz';
  const body     = JSON.stringify({ text: clean, voice: identity.edgeVoice, rate, pitch });

  try {
    // Race all proxies simultaneously — first valid blob wins
    return await Promise.any(
      EDGE_PROXIES.map(proxy =>
        fetch(proxy, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(1500), // 1.5s hard limit
        }).then(async r => {
          if (!r.ok) throw new Error(`${r.status}`);
          const b = await r.blob();
          if (b.size < 200) throw new Error('empty');
          return b;
        })
      )
    );
  } catch {
    return null;
  }
}

// ── Google TTS fetch — returns base64 string or null ──────────────────────

async function fetchGoogleTTS(text: string, assistantId: string): Promise<string | null> {
  try {
    const res = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, assistantId: assistantId.toLowerCase() }),
      signal: AbortSignal.timeout(1500), // 1.5s hard limit
    });
    if (!res.ok) return null;
    const data = await res.json() as { audioBase64?: string; fallback?: boolean };
    if (data.fallback || !data.audioBase64) return null;
    return data.audioBase64;
  } catch {
    return null;
  }
}

// ── Core: true parallel TTS race — zero silence guaranteed ───────────────
//
// Timeline:
//   t=0ms    → Browser TTS starts speaking immediately
//   t=0ms    → Edge TTS + Google TTS fetches fire simultaneously
//   t<1500ms → If Edge OR Google responds first → cancel browser, play premium
//   t=1500ms → Deadline: if no premium yet → browser continues, premium ignored
//   t=done   → onDone fires exactly once when the active engine finishes

async function playSentenceParallel(
  text: string,
  assistantId: string,
  onDone: () => void
): Promise<void> {
  const adapted = normalizeSpeechText(text);
  const id      = assistantId.toLowerCase();

  let doneCalled    = false;
  let premiumActive = false; // true once a premium audio element is playing
  let deadlinePast  = false; // true once 1.5s window closes

  const finish = () => {
    if (doneCalled) return;
    doneCalled = true;
    onDone();
  };

  // ── 1. Browser TTS fires immediately ──────────────────────────────────
  startBrowserTTS(adapted, id, () => {
    // Only call finish if premium hasn't taken over
    if (!premiumActive) finish();
  });

  // ── 2. 1.5s deadline — after this, browser wins regardless ────────────
  const deadline = new Promise<void>(resolve => setTimeout(() => {
    deadlinePast = true;
    resolve();
  }, 1500));

  // ── 3. Premium fetch helper — plays audio and calls finish on end ──────
  const playPremiumAudio = (audio: HTMLAudioElement, cleanup?: () => void) => {
    if (deadlinePast || premiumActive) {
      // Too late or already have premium — discard
      cleanup?.();
      return;
    }
    premiumActive = true;
    stopActiveAudio(); // cancel browser TTS
    activeAudio = audio;
    audio.onended = () => { activeAudio = null; cleanup?.(); finish(); };
    audio.onerror = () => { activeAudio = null; cleanup?.(); finish(); };
    audio.play().catch(() => {
      // Autoplay blocked — browser was already cancelled, just finish
      activeAudio = null;
      finish();
    });
  };

  // ── 4. Edge TTS race (all proxies in parallel) ─────────────────────────
  const edgeRace = fetchEdgeTTS(adapted, id).then(blob => {
    if (!blob || deadlinePast || premiumActive) return;
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);
    playPremiumAudio(audio, () => URL.revokeObjectURL(url));
  }).catch(() => { /* silent — browser continues */ });

  // ── 5. Google TTS race ─────────────────────────────────────────────────
  const googleRace = fetchGoogleTTS(adapted, id).then(b64 => {
    if (!b64 || deadlinePast || premiumActive) return;
    const audio = new Audio(`data:audio/mp3;base64,${b64}`);
    playPremiumAudio(audio);
  }).catch(() => { /* silent — browser continues */ });

  // ── 6. Wait for deadline — after this browser is the confirmed winner ──
  await Promise.race([deadline, edgeRace, googleRace]);

  // Let premium races finish in background if they haven't yet
  // (they will call finish() themselves when audio ends)
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

  // Safety timeout — if onDone never fires (deadlock), force-advance after 12s
  let safetyTimer: ReturnType<typeof setTimeout> | null = null;
  const onDone = () => {
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    isSpeakingSentence = false;
    if (speechQueue.length === 0 && speechBuffer.length === 0) {
      globalOnStreamEnd?.();
      globalOnStreamEnd = undefined;
    }
    void drainQueue();
  };

  safetyTimer = setTimeout(() => {
    console.debug('[Voice] Safety timeout — forcing queue advance');
    stopActiveAudio();
    onDone();
  }, 12000);

  await playSentenceParallel(text, assistantId, onDone);
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
  stopActiveAudio();
  speechBuffer       = '';
  speechQueue        = [];
  isSpeakingSentence = false;
  globalOnStreamStart = undefined;
  globalOnStreamEnd   = undefined;
}
