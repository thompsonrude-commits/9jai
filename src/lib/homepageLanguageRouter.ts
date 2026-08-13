/**
 * HOMEPAGE LANGUAGE ROUTER
 * Central system for detecting language and routing to appropriate language engines
 * Maintains Nigerian Pidgin as default while supporting instant language switching
 */

import { detectLanguage, getConversationLanguage, setConversationLanguage } from './language';

export interface LanguageRoute {
  code: string;
  name: string;
  folder: string;
  keywords: string[];
  greetings: string[];
  slang: string[];
}

// Central registry of all supported languages and their routing destinations
const LANGUAGE_ROUTES: Record<string, LanguageRoute> = {
  pcm: {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    folder: 'pidgin',
    keywords: ['how far', 'wetin', 'abeg', 'i dey', 'naija', 'go well', 'no vex', 'e go be fine', 'abi', 'oya'],
    greetings: ['how far', 'how yu dey', 'wetin dey happen', 'hello bro', 'hey sis'],
    slang: ['fine girl', 'fine boy', 'chale', 'wahala', 'pepper', 'setup', 'cruise', 'chill'],
  },
  yo: {
    code: 'yo',
    name: 'Yoruba',
    folder: 'yoruba',
    keywords: ['bawo', 'se dada', 'e nle', 'omo', 'awa', 'ile', 'orisa'],
    greetings: ['bawo ni', 'bawo nle', 'se dada', 'pele o', 'welcome'],
    slang: ['tio', 'igba', 'iyalode', 'oba', 'ewe'],
  },
  ig: {
    code: 'ig',
    name: 'Igbo',
    folder: 'igbo',
    keywords: ['kedu', 'onye', 'nno', 'dalu', 'biko', 'ebe', 'uwa'],
    greetings: ['kedu', 'kedu ka i mere', 'nno', 'welcome', 'i mebere'],
    slang: ['nwa', 'ala', 'chi', 'aguta', 'ndi'],
  },
  ha: {
    code: 'ha',
    name: 'Hausa',
    folder: 'hausa',
    keywords: ['sannu', 'yaya', 'lafiya', 'gida', 'kasuwa', 'aiki', 'gari'],
    greetings: ['sannu', 'sannu da waciya', 'lafiya lau', 'welcome', 'na gode'],
    slang: ['mai', 'dan', 'maje', 'kaida', 'mutane'],
  },
  edo: {
    code: 'edo',
    name: 'Edo',
    folder: 'edo',
    keywords: ['kọyọ', 'kọọ', 'vbèè', 'obiluu', 'ọbowiẹ', 'ọbavan', 'ọbota', 'obo kia', 'òkhíen', 'ẹdó'],
    greetings: ['kọyọ', 'kọọ', 'ọbowiẹ', 'ọbavan', 'ọbota', 'obo kia', 'òkhíen òwie', 'vbèè óye hé'],
    slang: ['obiluu', 'uzébu', 'iyoba', 'oba', 'omwan', 'i horen', 'ẹ̀dó', 'bini'],
  },
  efk: {
    code: 'efk',
    name: 'Efik',
    folder: 'efik',
    keywords: ['etim', 'abasi', 'idak', 'enyin', 'ekpo'],
    greetings: ['abasi yaimo', 'welkam', 'how body'],
    slang: ['okon', 'obong', 'ekpe', 'imaan'],
  },
  tiv: {
    code: 'tiv',
    name: 'Tiv',
    folder: 'tiv',
    keywords: ['iye', 'sha', 'iyaa', 'ikyum', 'chia'],
    greetings: ['iye', 'sha', 'iyaa', 'welcome', 'u joo'],
    slang: ['chia', 'ichongo', 'iwua', 'mbatsua'],
  },
  fuv: {
    code: 'fuv',
    name: 'Fulfulde',
    folder: 'fulfulde',
    keywords: ['salam', 'jaaraama', 'nyuurali', 'daande'],
    greetings: ['salam alaikum', 'jaaraama', 'salaam', 'welcome'],
    slang: ['pullo', 'coudi', 'maccudo', 'fulbe'],
  },
  kan: {
    code: 'kan',
    name: 'Kanuri',
    folder: 'kanuri',
    keywords: ['salamu', 'kiyam', 'kabu', 'gara'],
    greetings: ['salamu alaikum', 'kiyam', 'welcome', 'ya ji'],
    slang: ['kabugi', 'gara', 'mai', 'maje'],
  },
  sw: {
    code: 'sw',
    name: 'Swahili',
    folder: 'swahili',
    keywords: ['habari', 'jambo', 'asante', 'kwaherini', 'karibu'],
    greetings: ['habari gani', 'jambo', 'habari', 'welcome', 'karibu'],
    slang: ['mwalimu', 'rafiki', 'ndugu', 'watu', 'sana'],
  },
  en: {
    code: 'en',
    name: 'English',
    folder: 'english',
    keywords: ['hello', 'hi', 'hey', 'please', 'thank', 'thanks', 'help', 'question'],
    greetings: ['hello', 'hi', 'good morning', 'good afternoon', 'welcome'],
    slang: ['mate', 'buddy', 'friend', 'man', 'dude'],
  },
};

/**
 * Extract all keywords for fast matching
 */
const buildKeywordIndex = (): Map<string, string> => {
  const index = new Map<string, string>();
  for (const route of Object.values(LANGUAGE_ROUTES)) {
    const allTerms = [
      ...route.keywords,
      ...route.greetings,
      ...route.slang,
    ];
    for (const term of allTerms) {
      const normalized = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      index.set(normalized, route.code);
    }
  }
  return index;
};

const KEYWORD_INDEX = buildKeywordIndex();

/**
 * Detect which language a phrase belongs to based on keywords
 * Returns language code and confidence score
 */
export async function detectLanguageFromInput(text: string): Promise<{
  code: string;
  name: string;
  confidence: number;
  method: 'keyword' | 'detection' | 'default';
}> {
  if (!text?.trim()) {
    return { code: 'pcm', name: 'Nigerian Pidgin', confidence: 0.3, method: 'default' };
  }
  const lc = text.toLowerCase().trim();

  // STRICT unique markers — each language has markers NO other language uses
  const STRICT: Array<{ code: string; name: string; markers: string[] }> = [
    { code: 'yo',  name: 'Yoruba',         markers: ['bawo ni', 'ẹ kaaro', 'ẹ káàárọ̀', 'ẹ kaale', 'e se pupo', 'bẹẹni', 'bẹ́ẹ̀ni', 'o dabo', 'o dàbọ̀', 'kinni', 'ẹ pẹlẹ', 'e ṣeun', 'yoruba', 'jọ̀ọ́', 'bawo'] },
    { code: 'ig',  name: 'Igbo',           markers: ['kedu', 'kedụ', 'daalụ', 'ọ dị mma', 'igbo kwenu', 'gịnị', 'chukwu okike', 'igbo', 'biko', 'ututu ọma', 'nno', 'nnọọ', 'ehihie ọma'] },
    { code: 'ha',  name: 'Hausa',          markers: ['sannu da zuwa', 'ina kwana', 'lafiya lau', 'yaya dai', 'barka da safe', 'barka da rana', 'don allah', 'hausa', 'na gode', 'sannu'] },
    { code: 'edo', name: 'Edo',            markers: [
        // Verified from edolanguageandculture.substack.com
        'koyọ', 'kọyọ', 'koyo', 'vbọ yehẹ', 'ọ yẹse', 'uruẹse',
        'i dee', 'i rri', 'i rrowa', 'u dee', 'u gha', 'u ta ẹre', 'u tama',
        'a nakhin', 'a nikhin', 'a miẹrẹn', 'a kue', 'a rro owa',
        'dọmọ', 'ovbi mwẹn', 'omẹ', 'iyee', 'evbare', 'esuku',
        // Traditional markers
        'obiluu', 'ob\'ọwie', 'ob\'avan', 'ob\'ota', 'obokhian', 'osanobua',
        'uzébu', 'bini', 'benin city', 'mwẹn', 'lahọ', 'ẹdo',
    ]},
    { code: 'sw',  name: 'Swahili',        markers: ['habari gani', 'asante sana', 'karibu sana', 'hakuna matata', 'swahili', 'habari', 'jambo', 'asante', 'karibu', 'tafadhali', 'kwaheri'] },
    { code: 'efk', name: 'Efik',           markers: ['abasi yaimo', 'obong', 'ekpe efik', 'efik', 'emesiere', 'mokom', 'mbok'] },
    { code: 'tiv', name: 'Tiv',            markers: ['tiv kwagh', 'iyol tiv', 'mom tiv', 'tiv', 'msugh', 'aôndo', 'tar tiv'] },
    { code: 'fuv', name: 'Fulfulde',       markers: ['jaaraama', 'nyuurali', 'fulfulde', 'fulani', 'jam waali', 'tiyaabu', 'baraaji', 'mi yiði', 'mi anndi'] },
    { code: 'pcm', name: 'Nigerian Pidgin',markers: ['how far', 'wetin dey', 'abeg o', 'no wahala', 'i dey fine', 'naija', 'na so', 'oya make', 'e don be', 'pidgin', 'how you dey', 'wetin', 'abeg', 'oya na'] },
    { code: 'en',  name: 'English',        markers: ['hello', 'good morning', 'how are you', 'please', 'thank you', 'what is', 'can you', 'i need', 'could you', 'hi there', 'good evening'] },
  ];

  for (const lang of STRICT) {
    for (const marker of lang.markers) {
      if (lc.includes(marker)) {
        return { code: lang.code, name: lang.name, confidence: 0.92, method: 'keyword' };
      }
    }
  }

  // Script detection (Arabic, Chinese, etc.)
  if (/[\u0600-\u06FF]/.test(text)) return { code: 'ar', name: 'Arabic', confidence: 0.95, method: 'keyword' };
  if (/[\u4E00-\u9FFF]/.test(text)) return { code: 'zh', name: 'Chinese', confidence: 0.95, method: 'keyword' };
  if (/[\u0400-\u04FF]/.test(text)) return { code: 'ru', name: 'Russian', confidence: 0.95, method: 'keyword' };

  // Library detection fallback
  try {
    const detected = await detectLanguage(text);
    if (detected.code && detected.confidence > 0.65) {
      const route = LANGUAGE_ROUTES[detected.code];
      return { code: detected.code, name: route?.name || detected.code, confidence: detected.confidence, method: 'detection' };
    }
  } catch { /* ignore */ }

  // Default: Nigerian Pidgin
  return { code: 'pcm', name: 'Nigerian Pidgin', confidence: 0.4, method: 'default' };
}

/**
 * Get the route for a language code
 */
export function getLanguageRoute(code: string): LanguageRoute | null {
  return LANGUAGE_ROUTES[code] || null;
}

/**
 * Get all available language routes
 */
export function getAllLanguageRoutes(): LanguageRoute[] {
  return Object.values(LANGUAGE_ROUTES);
}

/**
 * Check if a language should trigger an auto-switch
 * Returns true if confidence is high enough to warrant switching
 */
export function shouldAutoSwitch(confidence: number): boolean {
  return confidence >= 0.65;
}

/**
 * Get homepage system prompt with language context
 */
export function getHomepageSystemPrompt(languageCode: string): string {
  const PROMPTS: Record<string, string> = {
    pcm: `You are 9JAI. You ONLY speak Nigerian Pidgin English (Naija). NEVER mix in Yoruba, Igbo, Hausa, or Edo words.
Pidgin rules: use wetin, dey, abeg, oya, sabi, wahala, no wahala, how far, e dey, na, dem, una, im, pikin, oga, nau naturally.
Greet first time: "How far! I be 9JAI. Wetin I fit do for you today? 🇳🇬"`,

    yo: `You are 9JAI. You ONLY speak Yoruba. NEVER mix Pidgin, Igbo, Hausa or Edo.
Use: Ẹ káàárọ̀ (morning), Ẹ káàlẹ́ (evening), E se (thanks), Bẹẹni (yes), Bẹẹkọ (no), Bawo ni (how are you), E jọ (please), O dabo (bye), Kinni (what).
Greet: "Ẹ káàbọ̀! Mo jẹ́ 9JAI. Kí ni mo lè ṣe fún yín?"`,

    ig: `You are 9JAI. You ONLY speak Igbo. NEVER mix Pidgin, Yoruba, Hausa or Edo.
Use: Ututu ọma (morning), Ehihie ọma (afternoon), Daalụ (thanks), Biko (please), Ee (yes), Mba (no), Kedu (how are you), Ọ dị mma (fine), Nno (welcome), Gịnị (what).
Greet: "Nnọọ! Aha m bụ 9JAI. Gịnị m ga-enyere gị aka?"`,

    ha: `You are 9JAI. You ONLY speak Hausa. NEVER mix Pidgin, Yoruba, Igbo or Edo.
Use: Barka da safe (morning), Barka da rana (afternoon), Na gode (thanks), Don Allah (please), Eh (yes), A'a (no), Yaya dai (how are you), Lafiya lau (fine), Sannu (hello).
Greet: "Sannu! Ni ne 9JAI. Me zan iya taimaka maka?"`,

    edo: `You are 9JAI. You ONLY speak Edo (Bini) language from Edo State, Nigeria. NEVER mix Pidgin, Yoruba, Igbo or Hausa.
Use: Kọyọ (hello), Ob'ọwie (good morning), Ob'avan (afternoon), Ob'ota (evening), Obiluu (thank you), Lahọ (please), Obokhian (welcome), Osanobua (God), Ọba (king), Uzébu (excellent).
Greet: "Kọyọ! I be 9JAI. Vbèè I ghi zẹ iran nẹ?"`,

    efk: `You are 9JAI. You ONLY speak Efik. Greet: "Abasi yaimo! Mi ye 9JAI."`,
    tiv: `You are 9JAI. You ONLY speak Tiv. Greet: "Iye! Nyi 9JAI."`,
    fuv: `You are 9JAI. You ONLY speak Fulfulde. Greet: "Jaaraama! Mi woni 9JAI."`,
    sw: `You are 9JAI. You ONLY speak Swahili. Greet: "Karibu! Mimi ni 9JAI. Ninaweza kukusaidia nini leo?"`,
    en: `You are 9JAI. Respond in clear, helpful English. Greet: "Hello! I'm 9JAI. How can I help you today?"`,
  };
  return PROMPTS[languageCode] ?? PROMPTS['pcm'];
}

/**
 * Determine dominant language in mixed-language text
 */
export async function getDominantLanguage(text: string): Promise<string> {
  // Split on punctuation and whitespace
  const segments = text.split(/[\s.!?,;:—–]/);
  const langCounts: Record<string, number> = {};

  for (const segment of segments) {
    if (!segment.trim()) continue;
    const result = await detectLanguageFromInput(segment);
    langCounts[result.code] = (langCounts[result.code] || 0) + 1;
  }

  if (Object.keys(langCounts).length === 0) return 'pcm';
  return Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Store and retrieve language context for a conversation
 */
let conversationLanguageContext: string = 'pcm';

export function setConversationLanguageContext(code: string): void {
  conversationLanguageContext = code;
  setConversationLanguage(code);
}

export function getConversationLanguageContext(): string {
  return conversationLanguageContext || getConversationLanguage() || 'pcm';
}

/**
 * Reset language context (useful for new conversations)
 */
export function resetLanguageContext(): void {
  conversationLanguageContext = 'pcm';
  setConversationLanguage('pcm');
}

