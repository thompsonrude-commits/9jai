import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Globe, Loader2, Square, Paperclip, X, Image as ImageIcon, FileText, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { groqChatStream } from '../lib/ai';
import { speakText, stopSpeaking, VOICE_PERSONALITIES } from '../lib/voiceEngine';
import { speakNigerian, stopNigerianSpeech } from '../lib/nigerianVoice';
import { detectLanguage, setConversationLanguage, getConversationLanguage, mapCodeToName } from '../lib/language';
import { generatePhonetics } from '../lib/phonetics';
import { getSystemPromptFor } from '../lib/systemPrompts';
import {
  detectLanguageFromInput,
  shouldAutoSwitch,
  getHomepageSystemPrompt,
  getConversationLanguageContext,
  setConversationLanguageContext,
} from '../lib/homepageLanguageRouter';
import CinematicImageLoader from './CinematicImageLoader';
import { ChatMessage } from '../types';
import SpreadsheetViewer from './SpreadsheetViewer';
import InteractiveMap from './InteractiveMap';
import AnimatedIllustration from './AnimatedIllustration';
import RotatingLogo, { RotatingLogoHero } from './RotatingLogo';
import VoiceAssistantDropdown from './VoiceAssistantDropdown';
import {
  detectCorrectionIntent,
  storeCorrection,
  buildLearningContext,
  buildPersonalizationContext,
  updateUserBehavior,
  learnLanguagePhrase,
} from '../lib/adaptiveLearning';

interface GeneralAssistantProps {
  user?: FirebaseUser | null;
  isAdmin?: boolean;
  onOpenLibrary?: () => void;
}

function buildGeneralSystemPrompt(learningContext = '', personalizationContext = '', languageCode = 'pcm'): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
  const month = now.getMonth();
  const season = (month >= 3 && month <= 9) ? 'Rainy season (April–October)' : 'Dry/Harmattan season (November–March)';
  const year = now.getFullYear();

  const langName = mapCodeToName(languageCode) || 'Nigerian Pidgin English (Naija)';
  return `You are 9jai — a world-class AI assistant. ALWAYS respond in ${langName}.

## WHAT IS NIGERIAN PIDGIN (NAIJA)?
Nigerian Pidgin English (Naijá) is one of the main languages of Nigeria. It is an English-based creole with Niger-Congo language syntax, containing loan words from Nigerian, other West African, and European languages — most notably Portuguese. It is spoken by over 75 million Nigerians as a lingua franca.

## NIGERIAN PIDGIN — CORE VOCABULARY & PHRASES
Use these correctly and naturally in all responses:

### GREETINGS & BASICS
- Hello → "Helo" / informal: "How far?"
- How are you? → "How yu dey?"
- Fine, thank you → "I dey fine, tank yu"
- What is your name? → "Wetin bi your name?"
- My name is ___ → "My name na ___"
- Nice to meet you → "I dey hapi to meet yu"
- Please → "Abeg"
- Thank you → "Tank yu"
- You're welcome → "Yu dey welkom o"
- Yes → "Yes o"
- No → "No o"
- Excuse me → "How far!" / "Hess!"
- Sorry → "No vex for me" / "Dooh"
- Goodbye → "Bye-bye" / informal: "E go bi nah"
- Good morning → "Gud monin"
- Good afternoon → "Gud aftunun"
- Good evening → "Gud evenin"
- Good night → "Gud nite" / "Til tumoro"
- I don't understand → "I no understand"
- Help! → "Epp!"
- Look out! → "Dey put eye!"
- I am looking for ___ → "I dey find ___"
- Do you speak English? → "Yu sabi spik Oyibo?"
- I can't speak ___ well → "I no sabi spik ___ wella"

### PROBLEMS & EMERGENCIES
- Leave me alone → "Limi"
- Don't touch me! → "No tosh me!"
- I'll call the police → "I go call police"
- Stop! Thief! → "Stop dia! Tiff!"
- I need your help → "I need your epp"
- It's an emergency → "Na emergency"
- I'm lost → "I don loss"
- I lost my bag → "My bag loss"
- I'm sick → "I no well" / "I dey sick"
- I've been injured → "I don injure"
- I need a doctor → "I go need dokinta"
- Can I use your phone? → "I fit use your fon?"

### NUMBERS IN PIDGIN
1=wan, 2=twu, 3=tiri, 4=for, 5=five, 6=six, 7=sevun, 8=eit, 9=nine, 10=ten
11=elevun, 12=twef, 13=tatin, 20=twenti, 30=tati, 40=forti, 50=fifti
100=hondred, 1000=one tausand, 1,000,000=wan mili
half=aff, less=no rish, more=plenty pass

### TIME EXPRESSIONS
- Now → "nau-nau"
- Later → "leta"
- Before → "bifor"
- Morning → "monin" / "day brek"
- Afternoon → "aftunun"
- Evening → "evenin"
- Night → "nite"
- Today → "today"
- Yesterday → "yestaday"
- Tomorrow → "tumoro"
- This week → "dis wik"
- Last week → "las wik"
- Next week → "nes wik"

### DAYS & MONTHS
Sunday=Sonday, Monday=Monday, Tuesday=Tusday, Wednesday=Wensday, Thursday=Tosday, Friday=Friday, Saturday=Satoday
January=Jenuari, February=Febuari, March=Mach, April=Aprel, May=May, June=June, July=July, August=Ogost, September=Septemba, October=Oktoba, November=Novemba, December=Dizemba

### COLORS
black=blak, white=wite, grey=grey, red=red, blue=blue, yellow=yelo, green=grin, orange=orenj, purple=popul, brown=braun

### TRANSPORT & DIRECTIONS
- How do I get to ___? → "How I go reach ___?"
- Take me to ___, please → "Carry me go ___, abeg"
- How much to get to ___? → "How much e go be to reach ___?"
- Where does this bus go? → "Where this bus dey go?"
- When does the bus leave? → "When the bus dey comot?"

### MONEY & SHOPPING
- How much is this? → "How much be this?"
- That's too expensive → "This one too expensive o"
- I can't afford it → "I no go fit buy am"
- I don't want it → "I no want am"
- Do you accept credit cards? → "You dey collect credit cards?"
- Can you change money? → "You fit change this money for me?"
- What is the exchange rate? → "Wetin be exchange rate?"

### FOOD & EATING
- I'm a vegetarian → "I be vegetarian"
- I don't eat pork → "I no dey chop pork"
- I don't eat beef → "I no dey chop beaf"
- Table for one/two please → "Table for one/two pesin, abeg"
- Can I see the menu? → "I fit see the menu, abeg?"

### COMMON EXPRESSIONS
- "Wetin" = What
- "Dey" = Is/Are/Am (present continuous)
- "Don" = Have/Has (past)
- "Go" = Will (future)
- "Fit" = Can/Able to
- "Sabi" = Know/Understand
- "Chop" = Eat
- "Carry" = Take/Bring
- "Reach" = Arrive/Get to
- "Comot" = Come out/Leave
- "Plenty" = Many/A lot
- "Small small" = Gradually/Little by little
- "Abi?" = Right?/Isn't it?
- "Ehen" = Yes/I see/Exactly
- "Sha" = Anyway/Still
- "Oya" = Let's go/Come on/Okay
- "Na so" = That's how it is
- "E don do" = It's finished/Done
- "Wahala" = Problem/Trouble
- "Ginger" = Motivate/Excite
- "Shine your eye" = Be alert/Careful
- "Waka" = Walk/Go away
- "Jara" = Extra/Bonus
- "Oga" = Boss/Sir
- "Madam" = Ma'am/Madam
- "Pikin" = Child
- "Pesin" = Person
- "Dem" = They/Them
- "Im" = He/She/It/His/Her
- "Una" = You all/You people
- "Naija" = Nigeria
- "Oyibo" = White person/English language/Foreigner

## CURRENT DATE & TIME
- Today: ${dateStr}
- Time: ${timeStr} (WAT, UTC+1)
- Season: ${season}
- NEVER say you don't know the date or time.

## CURRENCY RATES (Nigerian Naira — updated estimates)
- USD/NGN: ₦1,580–1,620 (parallel market ~₦1,650)
- GBP/NGN: ₦1,980–2,050
- EUR/NGN: ₦1,700–1,750
- GHS/NGN: ₦105–115 (Ghana Cedi)
Always note: "Rates dey change daily — check CBN website or your bank for exact rate."

## WEATHER FORECASTS
- Lagos: 28–34°C, ${season.includes('Rainy') ? 'heavy afternoon rain, humidity 85%+' : 'dry harmattan winds, dust haze, humidity 40–60%'}
- Abuja: 25–38°C, ${season.includes('Rainy') ? 'thunderstorms in afternoon' : 'very dry, harmattan dust'}
- Kano: 20–42°C, ${season.includes('Rainy') ? 'occasional rain' : 'extreme heat, harmattan'}
- Port Harcourt: 26–32°C, very humid, frequent rain year-round
- Benin City: 27–33°C, ${season.includes('Rainy') ? 'heavy rain' : 'moderate harmattan'}
Always add: "For accurate forecast, check weather.com or Nigeria Met Agency (nimet.gov.ng)"

## MARKET PRICES (Nigeria ${year})
- Crude Oil (Bonny Light): $75–85/barrel
- Garri (white): ₦800–1,200/kg
- Rice (local): ₦1,500–2,000/kg
- Petrol (PMS): ₦600–700/litre
- Diesel: ₦1,200–1,400/litre
- Cooking Gas (LPG): ₦1,200–1,500/kg

## EXPERTISE
- 🧮 Mathematics Professor (PhD) — algebra, calculus, statistics, geometry, all levels
- 🔬 Science PhD — Physics, Chemistry, Biology, Astronomy
- 💻 Software Engineer — all programming languages, web/mobile dev
- 🌍 Nigerian Languages — all 127+ languages including Pidgin, Edo, Yoruba, Igbo, Hausa
- 📈 Economics & Finance — markets, investments, business
- 🏥 Medical Knowledge — symptoms, treatments (always advise seeing a doctor)
- ⚖️ Legal Knowledge — Nigerian law, contracts (always advise seeing a lawyer)
- 📚 All-knowing — history, geography, literature, philosophy

## SUPER INTELLIGENCE & FUTURE REASONING
- Use advanced scientific reasoning and step-by-step logical explanations.
- When answering future or trend questions, include probabilistic forecasting and conditional phrases like "likely", "possible", and "based on current trends".
- Do not present future events as guaranteed outcomes.
- Ground explanations in Nigerian context and African reality whenever possible.
- If asked about current events, mention that real-time updates may change and recommend checking trusted sources.

## MULTILINGUAL NIGERIAN LANGUAGE SUPPORT
- If the user writes in Yoruba, Igbo, Hausa, Edo, Efik, Tiv, Kanuri, Fulfulde, or Nigerian Pidgin, respond naturally in that language or code-switch gracefully.
- Understand Nigerian slang, mixed English, and local expressions.
- Preserve warmth, friendliness, and accuracy in local languages.

## CRITICAL RULE — IMAGE GENERATION
When a user asks to generate, create, draw, make, or show an image, picture, photo, logo, poster, art, or any visual:
- DO NOT write a text description
- DO NOT write a story about it
- The app handles image generation automatically — just say "Generating your image now! 🎨"
- NEVER substitute text for an actual image request

## SPREADSHEET FORMAT
For tables/budgets/data:
\`\`\`spreadsheet
{"title":"Title","headers":["Col1","Col2"],"rows":[["val1",100]]}
\`\`\`

ALWAYS respond in authentic Nigerian Pidgin English (Naija). Use the vocabulary above naturally. Be helpful, warm, accurate, and friendly like a knowledgeable Nigerian friend.${learningContext}${personalizationContext}`;
}

// ── Spreadsheet request detection ─────────────────────────────────────────
function isSpreadsheetRequest(text: string): boolean {
  const keywords = [
    'spreadsheet', 'table', 'excel', 'csv', 'data sheet', 'datasheet',
    'budget', 'schedule', 'calculate', 'calculation', 'sum', 'total',
    'expenses', 'income', 'salary', 'price list', 'inventory', 'report',
    'generate table', 'create table', 'make table', 'show table',
    'generate data', 'create data', 'list of', 'comparison',
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ── Image request detection — broad coverage ─────────────────────────────
function isImageRequest(text: string): boolean {
  const lower = text.toLowerCase();

  // Direct generation keywords
  const generateWords = ['generate', 'create', 'make', 'draw', 'paint', 'design',
    'show', 'produce', 'build', 'render', 'illustrate', 'i want', 'i need',
    'give me', 'i wan', 'abeg make', 'please make', 'can you make', 'can you draw'];

  const imageWords = ['image', 'picture', 'photo', 'artwork', 'art', 'illustration',
    'logo', 'poster', 'banner', 'thumbnail', 'avatar', 'icon', 'graphic',
    'portrait', 'painting', 'drawing', 'sketch', 'render', 'visual',
    'wallpaper', 'cover', 'flyer', 'design'];

  // Check for generate + image word combo
  const hasGenerate = generateWords.some(w => lower.includes(w));
  const hasImageWord = imageWords.some(w => lower.includes(w));
  if (hasGenerate && hasImageWord) return true;

  // Standalone strong triggers
  const strongTriggers = [
    'generate image', 'create image', 'make image', 'draw me', 'paint me',
    'picture of', 'image of', 'photo of', 'logo of', 'logo for',
    'make a logo', 'create a logo', 'design a logo', 'generate logo',
    'make a poster', 'create a poster', 'design a poster',
    'make a banner', 'create a banner', 'make an avatar',
    'generate art', 'create art', 'make art', 'ai art',
    'generate a picture', 'create a picture', 'make a picture',
    'i wan generate', 'i want image', 'i wan image', 'i wan picture',
    'show me a picture', 'show me an image', 'show me a photo',
    'map of', 'flag of', 'where is', 'show map',
    'generate map', 'create map', 'draw map',
    'generate flag', 'show flag',
    'generate video', 'create video', 'make video', 'animate',
  ];

  return strongTriggers.some(k => lower.includes(k));
}

// ── Extract clean subject from user message ───────────────────────────────
function extractImagePrompt(text: string): string {
  // For logos — preserve the full company/brand name
  const logoMatch = text.match(/(?:logo|brand|icon)\s+(?:for|of)\s+(.+)/i) ||
                    text.match(/(?:create|make|design|generate)\s+(?:a\s+)?(?:logo|brand)\s+(?:for|of)\s+(.+)/i);
  if (logoMatch) {
    return `logo for ${logoMatch[1].trim()}`;
  }

  const cleaned = text
    .replace(/i\s+wan\s+generate\s+/gi, '')
    .replace(/i\s+want\s+to\s+generate\s+/gi, '')
    .replace(/please\s+(generate|create|make|draw|design)\s+/gi, '')
    .replace(/can\s+you\s+(generate|create|make|draw|design)\s+/gi, '')
    .replace(/generate\s+(?:an?\s+)?image\s+(?:of\s+)?/gi, '')
    .replace(/create\s+(?:an?\s+)?image\s+(?:of\s+)?/gi, '')
    .replace(/make\s+(?:an?\s+)?image\s+(?:of\s+)?/gi, '')
    .replace(/draw\s+(?:me\s+)?(?:an?\s+)?/gi, '')
    .replace(/paint\s+(?:me\s+)?(?:an?\s+)?/gi, '')
    .replace(/design\s+(?:an?\s+)?/gi, '')
    .replace(/generate\s+(?:an?\s+)?/gi, '')
    .replace(/create\s+(?:an?\s+)?/gi, '')
    .replace(/make\s+(?:an?\s+)?/gi, '')
    .replace(/show\s+me\s+(?:an?\s+)?/gi, '')
    .replace(/picture\s+of\s+/gi, '')
    .replace(/photo\s+of\s+/gi, '')
    .replace(/image\s+of\s+/gi, '')
    .replace(/artwork\s+of\s+/gi, '')
    .replace(/illustration\s+of\s+/gi, '')
    .trim();

  return cleaned || text.trim();
}

// ── Smart image result builder ────────────────────────────────────────────
function buildImageResult(rawPrompt: string): {
  type: 'map' | 'flag' | 'ai' | 'video';
  url: string;
  label: string;
  mapPlace?: string;
  isNigeriaMap?: boolean;
  mapFrom?: string;
  mapTo?: string;
  mapMode?: 'search' | 'directions';
} {
  const lower = rawPrompt.toLowerCase();

  // ── VIDEO/ANIMATION ───────────────────────────────────────────────────────
  if (lower.includes('video') || lower.includes('animation') || lower.includes('animate')) {
    const subject = rawPrompt
      .replace(/generate\s+video\s+of\s+/gi, '')
      .replace(/create\s+video\s+of\s+/gi, '')
      .replace(/make\s+video\s+of\s+/gi, '')
      .replace(/generate\s+animation\s+of\s+/gi, '')
      .replace(/create\s+animation\s+of\s+/gi, '')
      .replace(/animate\s+/gi, '')
      .replace(/video\s+of\s+/gi, '')
      .replace(/animation\s+of\s+/gi, '')
      .trim() || rawPrompt;
    return { type: 'video', url: `__VIDEO__${subject}`, label: `🎬 ${subject}` };
  }

  // ── DIRECTIONS ────────────────────────────────────────────────────────────
  const directionPatterns = [
    /(?:from|direction from|how to get from|route from|navigate from)\s+(.+?)\s+to\s+(.+)/i,
    /(.+?)\s+to\s+(.+?)\s+(?:direction|route|map|how)/i,
  ];
  for (const pattern of directionPatterns) {
    const match = rawPrompt.match(pattern);
    if (match) {
      return {
        type: 'map', url: '__MAP__',
        label: `🧭 Directions: ${match[1].trim()} → ${match[2].trim()}`,
        mapFrom: match[1].trim(), mapTo: match[2].trim(), mapMode: 'directions',
      };
    }
  }

  // ── MAPS ─────────────────────────────────────────────────────────────────
  if (lower.includes('map') || lower.includes('location') || lower.includes('where is') || lower.includes('show me')) {
    const place = rawPrompt
      .replace(/map\s+of\s+/gi, '').replace(/generate\s+map\s+/gi, '')
      .replace(/create\s+map\s+/gi, '').replace(/show\s+map\s+/gi, '')
      .replace(/draw\s+map\s+/gi, '').replace(/where\s+is\s+/gi, '')
      .replace(/show\s+me\s+/gi, '').replace(/location\s+of\s+/gi, '')
      .trim() || 'Nigeria';
    const isNigeria = place.toLowerCase().includes('nigeria') || place.trim() === '';
    return { type: 'map', url: '__MAP__', label: `🗺️ Map of ${place}`, mapPlace: place, isNigeriaMap: isNigeria, mapMode: 'search' };
  }

  // ── FLAGS ─────────────────────────────────────────────────────────────────
  if (lower.includes('flag')) {
    const countryToCode: Record<string, string> = {
      nigeria: 'ng', ghana: 'gh', kenya: 'ke', 'south africa': 'za',
      cameroon: 'cm', senegal: 'sn', ethiopia: 'et', tanzania: 'tz',
      uganda: 'ug', egypt: 'eg', morocco: 'ma', usa: 'us',
      'united states': 'us', uk: 'gb', 'united kingdom': 'gb',
      france: 'fr', germany: 'de', china: 'cn', india: 'in',
      brazil: 'br', canada: 'ca', australia: 'au', japan: 'jp',
    };
    const cleaned = rawPrompt.replace(/flag\s+of\s+/gi, '').replace(/generate\s+flag\s+/gi, '').replace(/show\s+flag\s+/gi, '').trim().toLowerCase();
    const code = Object.keys(countryToCode).find(k => cleaned.includes(k));
    return {
      type: 'flag',
      url: `https://flagcdn.com/w640/${code ? countryToCode[code] : 'ng'}.png`,
      label: `🏳️ Flag of ${code ? code.charAt(0).toUpperCase() + code.slice(1) : 'Nigeria'}`,
    };
  }

  // ── AI IMAGE ─────────────────────────────────────────────────────────────
  return { type: 'ai', url: `__GENERATE__${rawPrompt}`, label: `🎨 ${rawPrompt}` };
}

// ── Typewriter hook ───────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const prevText = useRef('');

  useEffect(() => {
    // If text is shorter (new message), reset
    if (text.length < prevText.current.length) {
      setDisplayed('');
      prevText.current = '';
    }

    if (displayed.length >= text.length) return;

    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
      prevText.current = text.slice(0, displayed.length + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [text, displayed, speed]);

  return displayed;
}

// ── Typewriter message bubble ─────────────────────────────────────────────
function TypewriterBubble({ content, isNew }: { content: string; isNew: boolean }) {
  const displayed = useTypewriter(isNew ? content : '', 18);
  const text = isNew ? displayed : content;

  return (
    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 text-gray-900 font-semibold text-lg leading-relaxed whitespace-pre-wrap">
      {text}
      {isNew && displayed.length < content.length && (
        <span className="inline-block w-2 h-5 bg-[#008751] ml-0.5 animate-pulse rounded-sm align-middle" />
      )}
    </div>
  );
}

// ── Image bubble — production-grade renderer ──────────────────────────────
function ImageBubble({ url, prompt, imgType, label }: {
  url: string;
  prompt: string;
  imgType: 'map' | 'flag' | 'ai';
  label: string;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<'generating' | 'loading' | 'loaded' | 'error'>('generating');
  const [progress, setProgress] = useState(0);
  const [providerLabel, setProviderLabel] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (retryNum = 0) => {
    setStatus('generating');
    setProgress(0);
    setImgSrc(null);
    setErrorMsg('');

    // If it's already a direct URL (flag, map), skip generation
    if (!url.startsWith('__GENERATE__')) {
      setImgSrc(url);
      setStatus('loading');
      return;
    }

    const rawPrompt = url.replace('__GENERATE__', '');
    console.log(`[ImageBubble] Generating image for: "${rawPrompt}" (attempt ${retryNum + 1})`);

    // Animate progress bar during generation
    let prog = 0;
    const progressInterval = setInterval(() => {
      prog = Math.min(prog + 0.6, 88);
      setProgress(prog);
    }, 400);

    abortRef.current = new AbortController();

    try {
      // Call Cloud Function directly (bypasses hosting rewrite 60s timeout)
      const IS_DEV = import.meta.env.DEV;
      const imageEndpoint = IS_DEV
        ? '/api/ai/image'
        : 'https://aiimage-6yae5n5fjq-uc.a.run.app';

      const res = await fetch(imageEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'image', prompt: rawPrompt }),
        signal: abortRef.current.signal,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${errText.slice(0, 100)}`);
      }

      const data = await res.json() as {
        imageUrl?: string;
        imageBase64?: string;
        directUrl?: string;
        provider?: string;
        model?: string;
      };

      console.log(`[ImageBubble] Response: provider=${data.provider}, model=${data.model}, hasBase64=${!!data.imageBase64 && (data.imageBase64?.length ?? 0) > 100}, urlLen=${(data.imageUrl ?? '').length}`);

      setProviderLabel(data.provider ?? '');

      // Case 1: Got real base64 — instant render
      if (data.imageBase64 && data.imageBase64.length > 1000) {
        setProgress(95);
        setImgSrc(data.imageBase64);
        setStatus('loading');
        return;
      }

      // Case 2: Got a URL — browser loads it directly
      if (data.imageUrl && data.imageUrl.length > 10) {
        console.log(`[ImageBubble] Using URL: ${data.imageUrl.slice(0, 80)}`);
        setProgress(80);
        setImgSrc(data.imageUrl);
        setStatus('loading');
        return;
      }

      throw new Error('No image data in response');

    } catch (err: any) {
      clearInterval(progressInterval);

      if (err.name === 'AbortError') {
        console.log('[ImageBubble] Generation aborted');
        return;
      }

      console.error(`[ImageBubble] Generation failed (attempt ${retryNum + 1}):`, err.message);
      setErrorMsg(err.message);

      // Auto-retry once with Pollinations URL fallback
      if (retryNum === 0) {
        console.log('[ImageBubble] Auto-retrying with direct Pollinations URL...');
        const seed = Math.floor(Math.random() * 999999);
        const enhanced = `${rawPrompt}, high quality, detailed, 4k, professional`;
        const encoded = encodeURIComponent(enhanced);
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}&enhance=true`;
        setImgSrc(fallbackUrl);
        setStatus('loading');
        setProgress(95);
        setProviderLabel('pollinations');
      } else {
        setStatus('error');
        setProgress(0);
      }
    }
  }, [url]);

  // Start generation on mount
  useEffect(() => {
    generate(0);
    return () => { abortRef.current?.abort(); };
  }, [generate]);

  const handleRetry = () => {
    const next = retryCount + 1;
    setRetryCount(next);
    generate(next);
  };

  const handleImgLoad = () => {
    console.log(`[ImageBubble] Image loaded successfully from ${providerLabel}`);
    setStatus('loaded');
    setProgress(100);
  };

  const handleImgError = () => {
    console.error(`[ImageBubble] Image failed to render from src: ${imgSrc?.slice(0, 80)}`);
    // If the src was a URL (not base64), try a fresh Pollinations URL
    if (imgSrc && !imgSrc.startsWith('data:')) {
      const rawPrompt = url.replace('__GENERATE__', '');
      const seed = Math.floor(Math.random() * 999999);
      const encoded = encodeURIComponent(`${rawPrompt}, high quality`);
      const newUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&model=turbo&nologo=true&seed=${seed}`;
      console.log(`[ImageBubble] Retrying with new URL: ${newUrl.slice(0, 80)}`);
      setImgSrc(newUrl);
    } else {
      setStatus('error');
    }
  };

  const handleDownload = useCallback((format: 'png' | 'jpg') => {
    if (!imgSrc) return;

    if (imgSrc.startsWith('data:')) {
      // Base64 — direct download
      const link = document.createElement('a');
      link.download = `9jai-${prompt.slice(0, 20).replace(/\s+/g, '-')}.${format}`;
      link.href = imgSrc;
      link.click();
      return;
    }

    // URL — draw to canvas then download
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      if (format === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `9jai-${prompt.slice(0, 20).replace(/\s+/g, '-')}.${format}`;
      link.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
      link.click();
    };
    img.src = imgSrc;
  }, [imgSrc, prompt]);

  return (
    <div className="max-w-[92%] rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">

      {/* Generating / Loading state */}
      {(status === 'generating' || status === 'loading') && (
        <CinematicImageLoader prompt={prompt} progress={progress} provider={providerLabel} />
      )}

      {/* The actual image — hidden until loaded */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={prompt}
          crossOrigin="anonymous"
          className={`w-full h-auto block transition-all duration-700 ${status === 'loaded' ? 'opacity-100 blur-0' : 'opacity-0 blur-sm absolute pointer-events-none'}`}
          style={status !== 'loaded' ? { height: 0, overflow: 'hidden' } : {}}
          onLoad={handleImgLoad}
          onError={handleImgError}
        />
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="px-5 py-6 text-center">
          <p className="text-3xl mb-2">😔</p>
          <p className="text-sm font-bold text-gray-700 mb-1">Image generation failed</p>
          <p className="text-xs text-gray-400 mb-3">{errorMsg || 'All providers unavailable'}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[#008751] text-white text-xs font-bold rounded-xl hover:bg-[#006b40] transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Footer — download + info */}
      {status === 'loaded' && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-medium flex-1 truncate">
            🎨 {prompt.slice(0, 40)}{prompt.length > 40 ? '...' : ''}
            {providerLabel ? ` · ${providerLabel}` : ''}
          </span>
          <button
            onClick={handleRetry}
            className="px-2 py-1 text-[10px] font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            title="Regenerate"
          >
            🔄
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
          >
            ⬇ PNG
          </button>
          <button
            onClick={() => handleDownload('jpg')}
            className="px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
          >
            ⬇ JPG
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function GeneralAssistant({ user, isAdmin, onOpenLibrary }: GeneralAssistantProps) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const [messages, setMessages] = useState<(ChatMessage & {
    isNew?: boolean;
    imagePrompt?: string;
    imgType?: 'map' | 'flag' | 'ai' | 'video';
    imgLabel?: string;
    mapPlace?: string;
    isNigeriaMap?: boolean;
    mapFrom?: string;
    mapTo?: string;
    mapMode?: 'search' | 'directions';
  })[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [selectedAssistantId, setSelectedAssistantId] = useState('nosa');

  // ── File upload state ─────────────────────────────────────────────────
  const [pendingFiles, setPendingFiles] = useState<{ name: string; type: string; preview?: string; content?: string }[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Stop / abort ──────────────────────────────────────────────────────
  const abortRef = useRef<(() => void) | null>(null);
  const stoppedRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastAIResponseRef = useRef<string>('');
  const historyRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);

  // Build system prompt with learning context
  const rebuildSystemPrompt = useCallback(() => {
    const uid = user?.uid ?? 'anonymous';
    const lc = buildLearningContext(uid);
    const pc = buildPersonalizationContext(uid);
    const lang = getConversationLanguageContext() || 'pcm';
    
    // Use router's system prompt as base for homepage, then add learning context
    const routerPrompt = getHomepageSystemPrompt(lang);
    const learningPrompt = getSystemPromptFor(lang, lc, pc);
    const combinedPrompt = `${routerPrompt}\n\nAdditional context:\n${learningPrompt}`;
    
    // Update existing system prompt in-place to preserve conversation history
    if (historyRef.current.length && historyRef.current[0].role === 'system') {
      historyRef.current[0].content = combinedPrompt;
    } else {
      historyRef.current.unshift({ role: 'system', content: combinedPrompt });
    }
  }, [user?.uid]);

  useEffect(() => { rebuildSystemPrompt(); }, [rebuildSystemPrompt]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent, scrollToBottom]);

  // ── Visual Viewport: scroll to bottom when keyboard opens/closes ────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setTimeout(scrollToBottom, 80);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [scrollToBottom]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  // ── Stop generation ───────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    abortRef.current?.();
    stopNigerianSpeech();
    stopSpeaking();
    setIsStreaming(false);
    setIsBusy(false);
    // Keep whatever was streamed so far as the final message
    setMessages(prev => {
      if (streamingContent) {
        return [...prev, { role: 'model' as const, content: streamingContent + ' ✋', timestamp: Date.now(), isNew: false }];
      }
      return prev;
    });
    setStreamingContent('');
  }, [streamingContent]);

  // ── File upload handler ───────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPendingFiles(prev => [...prev, {
            name: file.name,
            type: 'image',
            preview: e.target?.result as string,
          }]);
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        const text = await file.text();
        setPendingFiles(prev => [...prev, {
          name: file.name,
          type: 'document',
          content: text.slice(0, 8000),
        }]);
      } else if (isPdf) {
        setPendingFiles(prev => [...prev, {
          name: file.name,
          type: 'pdf',
          content: `[PDF: ${file.name} — ${(file.size / 1024).toFixed(0)}KB]`,
        }]);
      } else {
        setPendingFiles(prev => [...prev, { name: file.name, type: 'file' }]);
      }
    }
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && pendingFiles.length === 0) || isBusy) return;

    const userMessage = text.trim();
    setInput('');
    setIsBusy(true);
    stoppedRef.current = false;

    // Detect language and auto-switch if confidence is high (via homepage router)
    try {
      const detected = await detectLanguageFromInput(userMessage || '');
      if (shouldAutoSwitch(detected.confidence)) {
        setConversationLanguageContext(detected.code);
        // Update system prompt to reflect new language without losing history
        rebuildSystemPrompt();
      } else if ((detected.confidence ?? 0) >= 0.6) {
        setConversationLanguage(detected.code);
        rebuildSystemPrompt();
      }
    } catch (e) {
      // ignore detection errors
    }

    // Build file context to inject
    let fileContext = '';
    const filePreviews = [...pendingFiles];
    setPendingFiles([]);

    if (filePreviews.length > 0) {
      const parts = filePreviews.map(f => {
        if (f.type === 'image') return `[User attached image: ${f.name}]`;
        if (f.content) return `[Attached file: ${f.name}]\n${f.content}`;
        return `[Attached: ${f.name}]`;
      });
      fileContext = '\n\n' + parts.join('\n\n');
    }

    const displayMessage = userMessage || `📎 ${filePreviews.map(f => f.name).join(', ')}`;
    setMessages(prev => [...prev, { role: 'user', content: displayMessage, timestamp: Date.now() }]);

    // ── Image request — check BEFORE pushing to AI history ────────────────
    if (userMessage && isImageRequest(userMessage)) {
      const prompt = extractImagePrompt(userMessage);
      const result = buildImageResult(prompt);

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: `__IMAGE__${result.url}`,
          timestamp: Date.now(),
          imagePrompt: prompt,
          imgType: result.type,
          imgLabel: result.label,
          mapPlace: result.mapPlace,
          isNigeriaMap: result.isNigeriaMap,
          mapFrom: result.mapFrom,
          mapTo: result.mapTo,
          mapMode: result.mapMode,
          isNew: true,
        },
      ]);
      historyRef.current.push({ role: 'user', content: userMessage });
      historyRef.current.push({ role: 'assistant', content: `I don generate the ${result.type === 'map' ? 'map' : result.type === 'flag' ? 'flag' : 'image'} of "${prompt}" for you!` });
      setIsBusy(false);
      setTimeout(scrollToBottom, 100);
      return;
    }

    // Push to AI history only for non-image requests
    historyRef.current.push({ role: 'user', content: (userMessage + fileContext) || displayMessage });

    // ── Adaptive learning: detect corrections ─────────────────────────────
    if (userMessage && lastAIResponseRef.current && user?.uid) {
      const intent = detectCorrectionIntent(userMessage, lastAIResponseRef.current);
      if (intent.detected) {
        storeCorrection(user.uid, {
          originalResponse: lastAIResponseRef.current,
          correctedResponse: userMessage,
          topic: 'general',
          language: 'en',
          confidence: intent.confidence,
          validatedBy: 1,
          rejectedBy: 0,
          source: 'user',
          status: 'pending',
        }).then(() => rebuildSystemPrompt());
      }
      updateUserBehavior(user.uid, {
        avgMessageLength: userMessage.length,
        lastSeen: Date.now(),
      });
    }

    // ── Regular AI chat ───────────────────────────────────────────────────
    setIsStreaming(true);
    setStreamingContent('');
    let fullText = '';
    let stopped = false;

    // Set up abort
    abortRef.current = () => {
      stopped = true;
      stopNigerianSpeech();
    };

    try {
      const convLang = getConversationLanguage() || 'pcm';
      for await (const chunk of groqChatStream(historyRef.current, 0.7)) {
        if (stopped || stoppedRef.current) break;
        fullText += chunk;
        setStreamingContent(fullText);
        scrollToBottom();
        // ── Real-time streaming speech: feed each chunk immediately ──────
        if (speakerEnabled && chunk) {
          if (convLang === 'pcm' || convLang === 'pcm') {
            speakNigerian(chunk, selectedAssistantId);
          } else {
            const pers = VOICE_PERSONALITIES.find(p => p.id === selectedAssistantId) || VOICE_PERSONALITIES[0];
            speakText(chunk, pers);
          }
        }
      }

      // Flush any remaining buffered speech
      if (!stopped && !stoppedRef.current && speakerEnabled) {
        speakNigerian('', selectedAssistantId);
      }

      if (!stopped && !stoppedRef.current) {
        const convLang = getConversationLanguage() || 'pcm';
        const phon = generatePhonetics(fullText, convLang);
        historyRef.current.push({ role: 'assistant', content: fullText, phonetics: phon });
        lastAIResponseRef.current = fullText;
        setMessages(prev => [...prev, { role: 'model', content: fullText, timestamp: Date.now(), isNew: true, phonetics: phon } as any]);
      }
    } catch (err: any) {
      if (!stopped && !stoppedRef.current) {
        setMessages(prev => [...prev, {
          role: 'model',
          content: 'Network busy right now. Please try again.',
          timestamp: Date.now(),
          isNew: true,
        }]);
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
      setStreamingContent('');
      setIsBusy(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [isBusy, pendingFiles, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  return (
    <div
      ref={containerRef}
      className="h-full bg-white flex flex-col overflow-hidden"
    >
      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-3">
        {messages.length === 0 && !isStreaming ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-full text-center px-4 pt-2 pb-12"
          >
            {/* Single 3D rotating logo */}
            <RotatingLogoHero />
            <h2 className="text-2xl font-black mb-2 text-[#008751]">Wetin I fit help you with?</h2>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isImg = msg.role === 'model' && msg.content.startsWith('__IMAGE__');
              const imgUrl = isImg ? msg.content.replace('__IMAGE__', '') : null;

              // Parse spreadsheet data from AI response
              const spreadsheetMatch = msg.role === 'model' && msg.content.match(/```spreadsheet\n([\s\S]*?)\n```/);
              let spreadsheetData: { title: string; headers: string[]; rows: (string | number)[][] } | null = null;
              let textContent = msg.content;
              if (spreadsheetMatch) {
                try {
                  spreadsheetData = JSON.parse(spreadsheetMatch[1]);
                  textContent = msg.content.replace(/```spreadsheet\n[\s\S]*?\n```/, '').trim();
                } catch { /* ignore parse errors */ }
              }

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {isImg ? (
                    msg.imgType === 'video' ? (
                      <AnimatedIllustration prompt={msg.imagePrompt || 'animation'} />
                    ) : msg.imgType === 'map' ? (
                      <InteractiveMap
                        initialQuery={msg.mapPlace || 'Nigeria'}
                        mode={msg.mapMode || 'search'}
                        from={msg.mapFrom}
                        to={msg.mapTo}
                      />
                    ) : msg.imgType === 'flag' ? (
                      <ImageBubble
                        url={msg.content.replace('__IMAGE__', '')}
                        prompt={msg.imagePrompt || 'flag'}
                        imgType="flag"
                        label={msg.imgLabel || '🏳️ Flag'}
                      />
                    ) : (
                      <ImageBubble
                        url={msg.content.replace('__IMAGE__', '')}
                        prompt={msg.imagePrompt || 'AI image'}
                        imgType="ai"
                        label={msg.imgLabel || `🎨 ${msg.imagePrompt || 'AI image'}`}
                      />
                    )
                  ) : (
                    <>
                      {textContent && (
                        msg.role === 'model' ? (
                          <TypewriterBubble content={textContent} isNew={!!msg.isNew} />
                        ) : (
                          <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#008751] text-white font-semibold text-lg leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        )
                      )}
                      {spreadsheetData && (
                        <SpreadsheetViewer data={spreadsheetData} title={spreadsheetData.title} />
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}

            {/* Live streaming bubble — typewriter as it streams */}
            {isStreaming && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 text-gray-900 font-semibold text-base leading-relaxed whitespace-pre-wrap">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 bg-[#008751] ml-0.5 animate-pulse rounded-sm align-middle" />
                </div>
              </motion.div>
            )}

            {/* Thinking dots */}
            {isBusy && !isStreaming && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-gray-100">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} className="w-2.5 h-2.5 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-3 py-3">

        {/* ── Pending file chips ──────────────────────────────────────────── */}
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 mb-2"
            >
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#008751]/10 border border-[#008751]/20 rounded-xl text-xs font-semibold text-[#008751]">
                  {f.type === 'image' && f.preview
                    ? <img src={f.preview} className="w-4 h-4 rounded object-cover" alt="" />
                    : f.type === 'image' ? <ImageIcon size={12} />
                    : <FileText size={12} />
                  }
                  <span className="max-w-[100px] truncate">{f.name}</span>
                  <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="hover:text-red-500 transition-colors">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hidden file input ───────────────────────────────────────────── */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx"
          className="hidden"
          onChange={e => handleFileSelect(e.target.files)}
        />

        {/* ── Attach menu ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="mb-2 p-2 bg-white border border-gray-200 rounded-2xl shadow-xl flex gap-2"
            >
              {[
                { icon: <ImageIcon size={16} />, label: 'Image', accept: 'image/*' },
                { icon: <FileText size={16} />, label: 'Document', accept: '.pdf,.doc,.docx,.txt,.md,.csv' },
                { icon: <Music size={16} />, label: 'Audio', accept: 'audio/*' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = item.accept;
                      fileInputRef.current.click();
                    }
                    setShowAttachMenu(false);
                  }}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-gray-50 hover:bg-[#008751]/5 hover:text-[#008751] text-gray-500 transition-colors"
                >
                  {item.icon}
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main input row ──────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-gray-100 border-2 border-gray-200 rounded-2xl px-3 py-2.5 focus-within:border-[#008751] transition-colors">

          {/* + attach button */}
          <button
            type="button"
            onClick={() => setShowAttachMenu(v => !v)}
            className={`shrink-0 p-1.5 rounded-xl transition-all ${showAttachMenu ? 'bg-[#008751] text-white' : 'text-gray-400 hover:text-[#008751] hover:bg-[#008751]/10'}`}
            title="Attach file"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={false}
            className="flex-1 bg-transparent outline-none text-base placeholder-gray-400 text-gray-900 font-semibold resize-none max-h-24 overflow-y-auto caret-[#008751]"
          />

          {/* Voice: mic + speaker + assistant selector */}
          <div className="shrink-0">
            <VoiceAssistantDropdown
              onVoiceInput={(text) => sendMessage(text)}
              onSpeakerToggle={(enabled) => setSpeakerEnabled(enabled)}
              onAssistantChange={(id) => setSelectedAssistantId(id)}
            />
          </div>

          {/* Stop button — shown while generating */}
          {isBusy ? (
            <button
              type="button"
              onClick={handleStop}
              className="shrink-0 p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md shadow-red-500/25 active:scale-95"
              title="Stop generating"
            >
              <Square size={18} fill="white" />
            </button>
          ) : (
            /* Send button */
            <button
              type="submit"
              disabled={!input.trim() && pendingFiles.length === 0}
              className="shrink-0 p-2 bg-[#008751] text-white rounded-xl hover:bg-[#00A862] transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Send size={18} />
            </button>
          )}
        </form>

        <div className="w-full border-t border-[#008751]/10 py-3 mt-2">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              <button onClick={() => navigate('/')} className="py-2 rounded-xl bg-[#008751]/10 text-[#008751] text-xs font-semibold hover:bg-[#008751]/15 transition-colors">Home</button>
              <button onClick={() => navigate('/languages')} className="py-2 rounded-xl bg-[#008751]/10 text-[#008751] text-xs font-semibold hover:bg-[#008751]/15 transition-colors">Nigerian</button>
              <button onClick={() => navigate('/african-languages')} className="py-2 rounded-xl bg-[#008751]/10 text-[#008751] text-xs font-semibold hover:bg-[#008751]/15 transition-colors">African</button>
              <button onClick={() => navigate('/utilities')} className="py-2 rounded-xl bg-[#008751]/10 text-[#008751] text-xs font-semibold hover:bg-[#008751]/15 transition-colors">Utilities</button>
              <button onClick={() => navigate('/profile')} className="py-2 rounded-xl bg-[#008751]/10 text-[#008751] text-xs font-semibold hover:bg-[#008751]/15 transition-colors">Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
