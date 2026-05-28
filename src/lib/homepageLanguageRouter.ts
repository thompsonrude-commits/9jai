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
  if (!text || !text.trim()) {
    return { code: 'pcm', name: 'Nigerian Pidgin', confidence: 0.3, method: 'default' };
  }

  const lc = text.toLowerCase().trim();
  const normalized = lc.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Try keyword matching first (fastest, most reliable)
  const tokens = lc.split(/\s+/);
  const langScores: Record<string, number> = {};

  for (const token of tokens) {
    const clean = token.replace(/[^\p{L}]/gu, '');
    const cleanNorm = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Check direct matches and partial matches
    for (const [keyword, langCode] of KEYWORD_INDEX) {
      if (keyword === clean || keyword === cleanNorm || clean.includes(keyword) || cleanNorm.includes(keyword)) {
        langScores[langCode] = (langScores[langCode] || 0) + 1;
      }
    }
  }

  if (Object.keys(langScores).length > 0) {
    const topLang = Object.entries(langScores).sort((a, b) => b[1] - a[1])[0];
    const code = topLang[0];
    const route = LANGUAGE_ROUTES[code];
    return {
      code,
      name: route.name,
      confidence: Math.min(0.95, topLang[1] / tokens.length),
      method: 'keyword',
    };
  }

  // 2. Fall back to language detection
  try {
    const detected = await detectLanguage(text);
    const route = LANGUAGE_ROUTES[detected.code] || LANGUAGE_ROUTES.en;
    return {
      code: route.code,
      name: route.name,
      confidence: detected.confidence,
      method: 'detection',
    };
  } catch {
    // ignore
  }

  // 3. Default to Pidgin
  return {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    confidence: 0.4,
    method: 'default',
  };
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
  const route = LANGUAGE_ROUTES[languageCode];
  if (!route) {
    return `You are 9jai, a multilingual AI assistant. Respond in the user's language.`;
  }

  const prompts: Record<string, string> = {
    pcm: `You are 9jai, a Nigerian Pidgin speaking assistant. Greet warmly in Pidgin. Use natural Nigerian speech patterns, slang, and humor. Be conversational, helpful, and culturally aware.`,
    yo: `You are 9jai, a Yoruba speaking assistant. Respond in Yoruba naturally. Preserve tone marks and cultural context. Be warm and respectful.`,
    ig: `You are 9jai, an Igbo speaking assistant. Respond in Igbo naturally. Use proper Igbo phrases and cultural greetings. Be friendly and helpful.`,
    ha: `You are 9jai, a Hausa speaking assistant. Respond in Hausa naturally. Use proper greetings and respectful speech patterns. Be clear and helpful.`,
    edo: `You are 9jai, an Edo (Bini) speaking assistant. Greet warmly with "Kọyọ" and always respond in Edo language. Use authentic Edo phrases: "Obiluu" (thank you), "Ọbowiẹ" (good morning), "Ọbavan" (good afternoon), "Ọbota" (good evening), "Uzébu" (great/excellent), "Obo kia" (welcome). Be eloquent, culturally aware, and preserve Edo cultural context.`,
    efk: `You are 9jai, an Efik speaking assistant. Respond in Efik naturally. Be culturally respectful and warm.`,
    tiv: `You are 9jai, a Tiv speaking assistant. Respond in Tiv naturally. Be helpful and culturally aware.`,
    fuv: `You are 9jai, a Fulfulde speaking assistant. Respond in Fulfulde naturally. Be respectful and clear.`,
    kan: `You are 9jai, a Kanuri speaking assistant. Respond in Kanuri naturally. Be helpful and warm.`,
    sw: `You are 9jai, a Swahili speaking assistant. Respond in Swahili naturally. Be friendly and helpful.`,
    en: `You are 9jai, a multilingual AI assistant. Respond in English clearly and helpfully.`,
  };

  return prompts[languageCode] || prompts.en;
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

