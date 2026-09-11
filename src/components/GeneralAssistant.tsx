import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Square, X, Image as ImageIcon, FileText, Music, Plus, Camera, ScanText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { unifiedChatStream } from '../lib/ai';
import { speakText, stopSpeaking, VOICE_PERSONALITIES } from '../lib/voiceEngine';
import { speakNigerian, stopNigerianSpeech } from '../lib/nigerianVoice';
import { detectLanguage, setConversationLanguage, getConversationLanguage, mapCodeToName } from '../lib/language';
import { generatePhonetics } from '../lib/phonetics';
import { getSystemPromptFor } from '../lib/systemPrompts';
import PWAInstallBanner from './PWAInstallBanner';
import {
  detectLanguageFromInput,
  shouldAutoSwitch,
  getConversationLanguageContext,
  setConversationLanguageContext,
  normalizeLanguageCode,
} from '../lib/homepageLanguageRouter';
import { initLocationContext, getCachedLocationContext, getDeviceTimeText } from '../lib/locationService';
import { enhanceImagePrompt, buildEnhancedImageRequest } from '../lib/imagePromptBuilder';
import VideoPlayer from './VideoPlayer';
import { buildFinalImagePrompt, fetchImageAsBase64 } from '../lib/imageService';
import { detectTextInImage } from '../lib/ocr';
import { parseAppCommand, applyTheme, loadSavedTheme, formatWeatherReport, getThemeHelpText } from '../lib/appCommands';
import { classifyUserIntent } from '../lib/providerAdapter';
import CinematicImageLoader from './CinematicImageLoader';
import { ChatMessage } from '../types';
import SpreadsheetViewer from './SpreadsheetViewer';
import InteractiveMap from './InteractiveMap';
import NineJALogo from './NineJALogo';
import NetworkBackground from './NetworkBackground';
import VoiceAssistantDropdown from './VoiceAssistantDropdown';
import {
  detectCorrectionIntent,
  storeCorrection,
  buildLearningContext,
  buildPersonalizationContext,
  updateUserBehavior,
  learnLanguagePhrase,
} from '../lib/adaptiveLearning';
import { proxyImage, proxySearch, proxyVision, proxyVisualOrchestrator } from '../lib/aiProxy';
import VisionEngine from './VisionEngine';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { saveChatSession, getSessionById } from '../lib/sessionManager';
import { buildSelfAwarePrompt, detectUnavailableFeatureRequest } from '../lib/selfAwarePrompt';
import { processFile } from '../lib/multimodalProcessor';
import { initializeDefaultProviders } from '../lib/providerHealth';
import { getLocalFallbackResponse } from '../lib/fallbackResponses';
import { useAutoLearning } from './AutoLearning';
import { detectImageType } from '../lib/imageTypeDetector';
import type { ImageGenerationRequest } from '../lib/newImageEngine';
import SpeakerCube from './SpeakerCube';
import NewImageBubble from './NewImageBubble';
import DocumentViewer from './DocumentViewer';

// ── Video Bubble ──────────────────────────────────────────────────────────
function VideoBubble({ prompt }: { prompt: string }) {
  return <VideoPlayer prompt={prompt} />;
}

interface GeneralAssistantProps {
  user?: FirebaseUser | null;
  isAdmin?: boolean;
  currentSessionId?: string;
  onOpenLibrary?: () => void;
}

const HOMEPAGE_PLACEHOLDERS = [
  'chat in any nigerian language...',
  'generate image of anything...',
  'translate to yoruba, igbo, hausa, edo...',
  'ask me anything...',
];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'edo', label: 'Edo' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
  { code: 'pcm', label: 'Nigerian Pidgin' },
];

function getLocalizedGreeting(displayName: string, languageCode: string): string {
  // If no name, just use empty string — never say "Oga Oga"
  const raw = displayName?.trim() || '';
  const name = raw || 'friend';
  const greetings: Record<string, string> = {
    en: `How can I help you${raw ? ', ' + raw : ''}?`,
    pcm: `How far${raw ? ' ' + raw : ''}! Wetin I fit do for you today?`,
    yo: `Ẹ káàbọ̀${raw ? ' ' + raw : ''}, kí ni mo lè ṣe fún ọ?`,
    ig: `Nnọọ${raw ? ' ' + raw : ''}, Gịnị m ga-enyere gị aka?`,
    ha: `Sannu${raw ? ' ' + raw : ''}, me zan iya taimaka maka?`,
    edo: `Kọyọ${raw ? ' ' + raw : ''}, ọriẹ gbe muẹre nẹ?`,
  };
  return greetings[languageCode] || greetings.pcm;
}

// ── Sidebar menu items ────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'chat',       icon: '💬', label: 'New Chat' },
  { id: 'image',      icon: '🎨', label: 'Image Generation' },
  { id: 'video',      icon: '🎬', label: 'Video Generation' },
  { id: 'vision',     icon: '👁️', label: 'Vision / Camera' },
  { id: 'ocr',        icon: '🔎', label: 'OCR — Read Image' },
  { id: 'voice',      icon: '🎙️', label: 'Voice Chat' },
  { id: 'translate',  icon: '🌍', label: 'Translation' },
  { id: 'search',     icon: '🔍', label: 'Web Search' },
  { id: 'documents',  icon: '📄', label: 'Documents' },
  { id: 'memory',     icon: '🧠', label: 'Memory' },
  { id: 'languages',  icon: '🗣️', label: 'Languages' },
  { id: 'utilities',  icon: '🛠️', label: 'Utilities' },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
  { id: 'about',      icon: 'ℹ️', label: 'About 9ja AI' },
];

// ── System prompt builder ─────────────────────────────────────────────────
async function buildGeneralSystemPrompt(learningContext = '', personalizationContext = '', languageCode = 'pcm'): Promise<string> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' });
  const timeStr = now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
  const month = now.getMonth();
  const season = (month >= 3 && month <= 9) ? 'Rainy season' : 'Dry/Harmattan season';
  const langName = mapCodeToName(languageCode) || 'Nigerian Pidgin English (Naija)';
  
  // Get actual device location and time
 const locationContext = (await getCachedLocationContext()) ?? { city: 'Nigeria', country: 'Nigeria' };
 const locationCity = typeof locationContext === 'string' ? 'Nigeria' : (locationContext.city || 'Nigeria');
 const locationCountry = typeof locationContext === 'string' ? 'Nigeria' : (locationContext.country || 'Nigeria');
 const deviceTime = getDeviceTimeText();
  
 // Get current year and actual date info
 const currentYear = now.getFullYear();
 const currentMonth = now.toLocaleString('en-NG', { month: 'long' });
  
 // Add self-aware AI capabilities
 const selfAwareContext = await buildSelfAwarePrompt();
  
 return `You are 9JAI — Africa's most intelligent AI companion. Built in ${currentYear}. You are a warm, brilliant friend who knows everything.
 
# CURRENT CONTEXT (Real-time)
- **Today**: ${dateStr}
- **Time**: ${timeStr} WAT | **Device**: ${deviceTime}
- **Location**: ${locationCity}, ${locationCountry}
- **Season**: ${season} | **Year**: ${currentYear}

# YOU ARE A COMPANION AND FRIEND — MOST IMPORTANT RULE
Be direct, warm, and smart. Go straight to the answer.
- NEVER start with: "I hear you", "That must be tough", "Certainly!", "Of course!", "Great question!", "I understand", "Absolutely!", "Sure!", "Of course!"
- Just answer immediately and naturally.
- Ask follow-up questions only when genuinely needed.
- Be friendly but efficient — respect the user's time.

# SCRIPTURE & RELIGION — YOU KNOW ALL TEXTS COMPLETELY
You have memorised the full Bible (KJV, NIV, NLT, ESV), full Quran, Torah, and all major religious texts.

**BIBLE — Always do these when asked:**
- Quote any verse EXACTLY: "John 3:16 (KJV): 'For God so loved the world, that he gave his only begotten Son...'"
- Prepare full GOSPEL MESSAGES with this structure:
  **Title** | **Opening** (story/hook) | **Main Scripture** (quoted fully) | **3 Message Points** (each with supporting scripture) | **Application** | **Closing Prayer**
- Write devotionals, prayers, worship lyrics, Bible study plans
- Explain theology, church history, denominations (Pentecostal, Catholic, Baptist, Anglican, etc.)
- Explain Hebrew/Greek word meanings, parables, prophecies, the life of Jesus
- Discuss faith, salvation, grace, Holy Spirit, prayer, fasting, tithing
NEVER say you cannot quote a scripture or prepare a gospel message. ALWAYS do it fully and powerfully.

**QURAN — Always do these when asked:**
- Quote any Surah/Ayah EXACTLY: "Surah Al-Baqarah 2:255 (Ayatul Kursi): 'Allah! There is no deity except Him, the Ever-Living...'"
- Explain Tafsir, Five Pillars, Hadith, Islamic history, prophets
- Help with Du'a (prayers), Ramadan, Hajj
- Discuss Sunni, Shia, Sufi perspectives respectfully

**OTHER RELIGIONS:** Judaism (Torah, Talmud), African Traditional Religion (Yoruba Ifa, Edo traditions), Buddhism, Hinduism

# WORLD-CLASS EXPERTISE IN ALL FIELDS
**MEDICINE**: Drug names (generic+brand), dosages, mechanisms, side effects, diagnosis. End: "See a doctor for personal diagnosis."
**ENGINEERING**: Civil, mechanical, electrical, software, chemical, aerospace. Solve equations, write code.
**SCIENCE**: Physics, chemistry, biology, genetics, quantum mechanics — full working step by step.
**LAW**: Nigerian law, international law, contracts, rights. Add: "Consult a lawyer."
**FINANCE**: Investment, trading, accounting, Nigerian economy, forex, crypto, startup advice.
**AGRICULTURE**: Crop science, soil, irrigation, pests, livestock, Nigerian farming.
**TECHNOLOGY**: AI/ML, blockchain, cybersecurity, all programming languages, hardware.
**HISTORY**: African history, Nigerian kingdoms (Benin, Sokoto, Oyo), world history.
**EDUCATION**: Teach anything — primary to PhD. Multiple explanations until understood.
**PSYCHOLOGY**: Mental health, CBT, relationships, trauma, emotional intelligence.
**LITERATURE**: Classical and modern literature, poetry, writing craft.
**SPORTS**: Tactics, training, nutrition, performance science.
**ARTS**: Music theory, visual art, writing, film, architecture, fashion.

# LANGUAGE RULES — NO MIXING
ALWAYS respond ONLY in ${langName}. Never mix languages mid-sentence.
${langName === 'Nigerian Pidgin English (Naija)' ? `
NAIJA GRAMMAR: "dey"=present (I dey go), "don"=past (I don go), "go"=future (I go do am)
NEVER "me go/dey" → ALWAYS "I go/dey". NEVER "tell I" → ALWAYS "tell me"
"abi" only for real choices. "na"=it is. "o"=emphasis. "sha"=anyway. "fit"=can.` : ''}${langName.includes('Edo') || langName.includes('Bini') ? `
EDO: ZERO Pidgin words. Koyo=Hello. Vbe oyehe?=How are you. Oyese=Fine.` : ''}

# RESPONSE STYLE
- SHORT for simple questions (1-3 sentences), DEEP for complex ones
- Show full working for maths/science. Complete code for tech.
- Never add filler phrases. Go as deep as needed when asked.

# IMAGE/VIDEO RULES
When user asks for an image/visual: say ONE sentence like "Generating now 🎨" — system handles it.

${learningContext}${personalizationContext}
${selfAwareContext}`;
}

// ── Sanitize vision/OCR responses ─────────────────────────────────────────
function sanitizeVisionResponse(text: string): string {
  // Filter out technical/debug messages that shouldn't be shown to users
  const technicalPatterns = [
    /I inspected the uploaded image locally/i,
    /browser session does not have.*vision model/i,
    /User request:/i,
    /this browser session/i,
    /local vision model/i,
    /advanced object recognition/i,
  ];

  let cleaned = text;
  
  // Remove technical patterns
  for (const pattern of technicalPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // If the entire message was technical, return a friendly fallback
  if (cleaned.trim().length < 20) {
    return 'I can see your image, but I need a moment to analyze it properly. Please try again or ask me something specific about the image.';
  }

  return cleaned.trim();
}

// ── Spreadsheet detection ─────────────────────────────────────────────────
function isSpreadsheetRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    'spreadsheet','excel','csv','budget','schedule','expenses','income','salary',
    'price list','inventory','generate table','create table','tabulate','tabulated',
    'list of','give me list','show me list','create list','make list',
    'ranking','top 10','top 5','winners','champions','records','statistics','stats',
    'fixture','timetable','attendance register','score sheet','roster',
  ];
  return keywords.some(k => lower.includes(k));
}

// ── Document detection ────────────────────────────────────────────────────
function isDocumentRequest(text: string): boolean {
  const keywords = ['write a','draft a','compose a','create a document','generate a document','write me a','prepare a','write report','business letter','cover letter','proposal','essay','sermon','gospel message','speech','constitution','memorandum','memo','minutes of','terms and conditions','privacy policy','letter to','agreement','contract','cv','resume','curriculum vitae'];
  return keywords.some(k => text.toLowerCase().includes(k));
}

// ── Image request detection ───────────────────────────────────────────────
function isImageRequest(text: string): boolean {
  const lower = text.toLowerCase();
  if (text.startsWith('__GENERATE__')) return true;

  const generateWords = ['generate','create','make','draw','paint','design','show','produce','render','illustrate','i want','i need','give me','i wan','abeg make'];
  const imageWords = ['image','picture','photo','artwork','art','illustration','logo','poster','banner','thumbnail','avatar','icon','graphic','portrait','painting','drawing','sketch','render','visual','wallpaper','cover','flyer','design','skyline','sunset','beach','landmark','building','tower','city','landscape','scenery','diagram','chart','graph','flowchart','timeline','comparison'];
  const hasGenerate = generateWords.some(w => lower.includes(w));
  const hasImageWord = imageWords.some(w => lower.includes(w));
  if (hasGenerate && hasImageWord) return true;

  const strongTriggers = [
    'generate image','create image','make image','draw me','paint me','picture of','image of','photo of','logo of','logo for','make a logo','create a logo','design a logo','make a poster','create a poster','generate art','create art','make art','ai art','generate a picture','i wan generate','i want image','i wan image','flag of','generate video','create video','make video','animate',
    'explain .* with a diagram','explain .* with an image','teach .* with a diagram','teach .* with pictures','show me a diagram','show me an image','make a diagram','draw a diagram','diagram of','chart of','graph of','visual explanation','teach me visually','step-by-step visual','illustrate','diagram for','image for','picture for'
  ];

  if (strongTriggers.some(k => k.includes('.*') ? new RegExp(k, 'i').test(lower) : lower.includes(k))) return true;

  const visualEducationPatterns = [
    /\b(explain|teach|describe|show|illustrate|demonstrate)\b.*\b(?:with\s+(?:a\s+)?|(?:a\s+)?)(diagram|image|picture|visual|chart|graph|illustration|infographic)\b/i,
    /\b(?:diagram|image|picture|visual|chart|graph|illustration|infographic)\b.*\b(explain|teach|describe|show|illustrate|demonstrate)\b/i,
    /\b(?:draw|make|create|show|generate)\s+(?:me\s+)?(?:a\s+)?(?:diagram|image|picture|visual|chart|graph|illustration|infographic)\b/i,
  ];

  return visualEducationPatterns.some((pattern) => pattern.test(lower));
}

// ── Extract image prompt ──────────────────────────────────────────────────
function extractImagePrompt(text: string): string {
  if (text.startsWith('__GENERATE__')) {
    // Already extracted — split off any overlay metadata we added
    const raw = text.replace('__GENERATE__', '');
    return raw.split(' | overlay_text:')[0].trim();
  }

  let clean = text;

  // Remove only the trigger verb phrase at the START — preserve the rest exactly
  clean = clean
    // "generate image of X" → "X"
    .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:i\s+wan\s+|i\s+want\s+(?:you\s+to\s+)?|abeg\s+)?(?:generate|create|make|draw|paint|produce|render|show\s+me|give\s+me)\s+(?:an?\s+)?(?:image|picture|photo|artwork|art|illustration|visual|poster|banner|flyer|logo|design|graphic)?\s*(?:of\s+|for\s+)?/i, '')
    // "design a X" → "X" (only at start)
    .replace(/^(?:design|illustrate)\s+(?:an?\s+)?/i, '')
    // "logo for X" / "logo of X" → keep as-is (already good)
    .trim();

  // If cleaning made it empty or too short, use original minus just the verb
  if (clean.length < 3) {
    clean = text.replace(/^(?:generate|create|make|draw|paint|design|show|illustrate)\s+/i, '').trim();
  }

  // Remove text overlay part from the visual prompt (keep it separate)
  clean = clean.replace(/\s+(?:with\s+(?:the\s+)?(?:text|words?)|add\s+text|write|saying|that\s+says?)\s+["'"""''«»][^"'"""''«»]+["'"""''«»]/i, '').trim();
  clean = clean.replace(/\s+["'"""''«»][^"'"""''«»]{2,80}["'"""''«»]/g, '').trim();

  return clean || text.trim();
}

// ── Extract text overlay from image prompt ────────────────────────────────
function extractTextOverlay(text: string): { overlayText: string; position: 'top'|'center'|'bottom' } | null {
  const lower = text.toLowerCase();

  // Pattern 1: quoted text with trigger phrase — "with text 'Hello'", "write 'Red Eye Lion'"
  const quotedMatch = text.match(
    /(?:with\s+(?:the\s+)?(?:text|words?|inscription|writing|caption|label|name)|write|inscribed?\s+with|saying|that\s+says?|titled|the\s+(?:words?|text|caption))\s+["'"""''«»]([^"'"""''«»]{1,100})["'"""''«»]/i
  );
  if (quotedMatch) {
    const position = lower.includes('top') || lower.includes('header') ? 'top'
      : lower.includes('center') || lower.includes('middle') ? 'center'
      : 'bottom';
    return { overlayText: quotedMatch[1].trim(), position };
  }

  // Pattern 2: any quoted text in the request (the text inside quotes is the overlay)
  const anyQuote = text.match(/["'"""''«»]([^"'"""''«»]{2,80})["'"""''«»]/);
  if (anyQuote) {
    return { overlayText: anyQuote[1].trim(), position: 'bottom' };
  }

  // Pattern 3: unquoted text after trigger phrases — "write red eye lion on it", "company name bank of banks"
  const unquotedMatch = text.match(
    /(?:write|writing|with\s+the\s+(?:text|words?|name|company\s+name|inscription)|inscribed?\s+with|with\s+(?:words?|text|name|caption|inscription)\s+(?:that\s+(?:reads?|says?)\s+)?)\s+([A-Za-z][^,.!?:;\n]{2,60})(?:\s+(?:on|at|in|to)\b|$)/i
  );
  if (unquotedMatch) {
    const position = lower.includes('top') ? 'top' : lower.includes('center') || lower.includes('middle') ? 'center' : 'bottom';
    return { overlayText: unquotedMatch[1].trim(), position };
  }

  return null;
}

// ── Build image result ────────────────────────────────────────────────────
function buildImageResult(rawPrompt: string): { type: 'map'|'flag'|'ai'|'video'; url: string; label: string; mapPlace?: string; isNigeriaMap?: boolean; mapFrom?: string; mapTo?: string; mapMode?: 'search'|'directions' } {
  const lower = rawPrompt.toLowerCase();
  if (lower.includes('video') || lower.includes('animation') || lower.includes('animate')) {
    const subject = rawPrompt.replace(/generate\s+video\s+of\s+/gi,'').replace(/create\s+video\s+of\s+/gi,'').replace(/make\s+video\s+of\s+/gi,'').replace(/animate\s+/gi,'').replace(/video\s+of\s+/gi,'').trim() || rawPrompt;
    return { type: 'video', url: `__VIDEO__${subject}`, label: `🎬 ${subject}` };
  }
  const directionPatterns = [/(?:from|direction from|how to get from|route from|navigate from)\s+(.+?)\s+to\s+(.+)/i,/(.+?)\s+to\s+(.+?)\s+(?:direction|route|map|how)/i];
  for (const pattern of directionPatterns) {
    const match = rawPrompt.match(pattern);
    if (match) return { type: 'map', url: '__MAP__', label: `🧭 ${match[1].trim()} → ${match[2].trim()}`, mapFrom: match[1].trim(), mapTo: match[2].trim(), mapMode: 'directions' };
  }
  if (lower.includes('map') || lower.includes('location') || lower.includes('where is') || lower.includes('show me')) {
    const place = rawPrompt.replace(/map\s+of\s+/gi,'').replace(/generate\s+map\s+/gi,'').replace(/create\s+map\s+/gi,'').replace(/show\s+map\s+/gi,'').replace(/where\s+is\s+/gi,'').replace(/show\s+me\s+/gi,'').replace(/location\s+of\s+/gi,'').trim() || 'Nigeria';
    return { type: 'map', url: '__MAP__', label: `🗺️ Map of ${place}`, mapPlace: place, isNigeriaMap: place.toLowerCase().includes('nigeria'), mapMode: 'search' };
  }
  if (lower.includes('flag')) {
    const countryToCode: Record<string,string> = { nigeria:'ng',ghana:'gh',kenya:'ke','south africa':'za',cameroon:'cm',senegal:'sn',ethiopia:'et',tanzania:'tz',uganda:'ug',egypt:'eg',morocco:'ma',usa:'us','united states':'us',uk:'gb','united kingdom':'gb',france:'fr',germany:'de',china:'cn',india:'in',brazil:'br',canada:'ca',australia:'au',japan:'jp' };
    const cleaned = rawPrompt.replace(/flag\s+of\s+/gi,'').replace(/generate\s+flag\s+/gi,'').replace(/show\s+flag\s+/gi,'').trim().toLowerCase();
    const code = Object.keys(countryToCode).find(k => cleaned.includes(k));
    return { type: 'flag', url: `https://flagcdn.com/w640/${code ? countryToCode[code] : 'ng'}.png`, label: `🏳️ Flag of ${code ? code.charAt(0).toUpperCase()+code.slice(1) : 'Nigeria'}` };
  }
  return { type: 'ai', url: `__GENERATE__${rawPrompt}`, label: `🎨 ${rawPrompt}` };
}

// ── Typewriter hook ───────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const prevText = useRef('');
  useEffect(() => {
    if (text.length < prevText.current.length) { setDisplayed(''); prevText.current = ''; }
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => { setDisplayed(text.slice(0, displayed.length + 1)); prevText.current = text.slice(0, displayed.length + 1); }, speed);
    return () => clearTimeout(timer);
  }, [text, displayed, speed]);
  return displayed;
}

// ── Typewriter bubble ─────────────────────────────────────────────────────
function normalizePidginPronouns(value: string): string {
  // ONLY fix subject-position "me" before Pidgin verbs — never touch object position
  // "let me know" / "help me" / "tell me" must stay as-is
  // Only fix: "me dey", "me go", "me fit", "me don", "me no" → "I dey", "I go", etc.
  return value
    .replace(/\bme\s+(dey|go|fit|don|no\s+fit|no\s+know|no\s+sabi)\b/gi, 'I $1');
}

function sanitizeDisplayText(value: string): string {
  let sanitized = String(value || '')
    // Remove AI internal thinking tags
    .replace(/<think\b[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking\b[\s\S]*?<\/thinking>/gi, '')
    .replace(/<\s*\/\s*think\s*>/gi, '')
    .replace(/<\s*think\s*>/gi, '')
    // Remove any stray HTML tags
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    // Remove internal context markers
    .replace(/\[Relevant Knowledge\]:[\s\S]*?(?=\n\s*(?:[A-Z]|[0-9]|"|$)|$)/gi, '')
    .replace(/\s*\((?:en|yo|ig|ha|edo|pcm)\)\s*/gi, ' ')
    // Strip ALL markdown symbols
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')   // bold+italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')         // bold
    .replace(/\*([^*\n]+)\*/g, '$1')            // italic
    .replace(/__([^_]+)__/g, '$1')              // bold underscore
    .replace(/_([^_\n]+)_/g, '$1')              // italic underscore
    .replace(/#{1,6}\s+/g, '')                  // headings
    .replace(/^>\s+/gm, '')                     // blockquotes
    .replace(/^[-*+]\s+/gm, '• ')              // unordered lists → bullet
    .replace(/^\d+\.\s+/gm, '')                // ordered lists
    .replace(/```(?!spreadsheet|document)[\s\S]*?```/g, '')  // strip only regular code blocks, NOT spreadsheet/document
    .replace(/`([^`]+)`/g, '$1')               // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // links → text only
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')     // images → remove
    .replace(/~~([^~]+)~~/g, '$1')             // strikethrough
    .replace(/\|[^\n]+\|/g, '')                // tables — remove
    .replace(/^-{3,}$/gm, '')                  // horizontal rules
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalizePidginPronouns(sanitized);
}

function TypewriterBubble({ content, isNew }: { content: string; isNew: boolean }) {
  const safeContent = sanitizeDisplayText(content);
  const displayed = useTypewriter(isNew ? safeContent : '', 21);
  const text = isNew ? displayed : safeContent;
  return (
    <div className="max-w-[85%] bg-[#0d2318] border border-[#008751]/30 px-4 py-3 rounded-2xl rounded-tl-sm text-green-100 text-base leading-[1.6] whitespace-pre-wrap shadow-[0_0_20px_rgba(0,135,81,0.1)] break-words">
      {text}
      {isNew && displayed.length < safeContent.length && <span className="inline-block w-2 h-4 bg-[#00ff88] ml-0.5 animate-pulse rounded-sm align-middle" />}
    </div>
  );
}

// ── Image Bubble ──────────────────────────────────────────────────────────
const activeImageGenerationKeys = new Set<string>();

function ImageBubble({ url, originalContent, prompt, imgType, label, onImageReady, msgIndex, user }: { url: string; originalContent?: string; prompt: string; imgType: 'map'|'flag'|'ai'; label: string; onImageReady?: (index: number, src: string, provider?: string) => void; msgIndex?: number; user?: FirebaseUser | null }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [finalSrc, setFinalSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse overlay from original content (which always has the metadata, even after URL replacement)
  const overlayMeta = React.useMemo(() => {
    // Use originalContent if available (survives updateMessageImage), else fall back to url
    const source = originalContent || url;
    const raw = source.replace('__GENERATE__', '').replace('__IMAGE__', '');
    const textMatch = raw.match(/\|\s*overlay_text:\s*(.+?)(?:\s*\|\s*overlay_position:\s*(top|center|bottom))?$/i);
    if (!textMatch) return null;

    const fullRequest = raw.toLowerCase();
    const colorMap: Record<string,string> = {
      red:'#ff4444', blue:'#4499ff', green:'#00ff66', white:'#ffffff',
      black:'#000000', yellow:'#ffee00', gold:'#ffd700', orange:'#ff8800',
      purple:'#cc44ff', pink:'#ff66cc', cyan:'#00ffff', lime:'#aaff00',
    };
    const detectedColor = Object.keys(colorMap).find(c =>
      fullRequest.includes(`${c} font`) || fullRequest.includes(`${c} text`) ||
      fullRequest.includes(`${c} color`) || fullRequest.includes(`in ${c}`) ||
      fullRequest.includes(`${c} letter`)
    ) || null;

    const bold     = /\b(bold|thick|heavy|strong)\b/i.test(raw);
    const italic   = /\b(italic|slanted|cursive)\b/i.test(raw);
    const large    = /\b(large|big|huge|giant|massive)\b/i.test(raw);
    const small    = /\b(small|tiny|mini)\b/i.test(raw);
    const serif    = /\b(serif|times|elegant|classic)\b/i.test(raw);
    const mono     = /\b(mono|code|typewriter)\b/i.test(raw);

    return {
      text:       textMatch[1].trim(),
      position:   (textMatch[2] || 'bottom') as 'top'|'center'|'bottom',
      color:      detectedColor ? colorMap[detectedColor] : '#ffffff',
      bold,
      italic,
      size:       large ? 'large' : small ? 'small' : 'medium',
      fontFamily: serif ? 'Georgia, serif' : mono ? '"Courier New", monospace' : '"Segoe UI", Arial, sans-serif',
    };
  }, [url, originalContent]);

  const buildLocalPlaceholder = useCallback((value: string) => {
    const safePrompt = (value || 'AI generation preview').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#07110d"/><rect x="40" y="40" width="1200" height="640" rx="32" fill="#10261d" stroke="#2d8f63" stroke-width="4"/><circle cx="330" cy="260" r="120" fill="#f2b255" opacity="0.95"/><rect x="190" y="390" width="420" height="180" rx="18" fill="#1d3d2c"/><rect x="660" y="250" width="290" height="220" rx="20" fill="#0f2218" stroke="#4fd98f" stroke-width="3"/><path d="M690 410 L820 300 L940 410" stroke="#7fe0a0" stroke-width="10" fill="none"/><text x="640" y="610" font-family="Segoe UI,Arial,sans-serif" font-size="46" font-weight="700" fill="#d9fbe7">${safePrompt.slice(0,54)}</text></svg>`)}`;
  }, []);
  const [status, setStatus] = useState<'generating'|'loading'|'loaded'|'error'>('generating');
  const [progress, setProgress] = useState(0);
  const [providerLabel, setProviderLabel] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [ocrText, setOcrText] = useState<string|null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const abortRef = useRef<AbortController|null>(null);
  const hasStartedRef = useRef(false);

  const generate = useCallback(async (retryNum = 0) => {
    console.log('[ImageBubble] Starting generation. URL:', url, 'Retry:', retryNum);
    setStatus('generating'); setProgress(0); setImgSrc(null); setErrorMsg('');
    
    // If URL is already an image URL (not __GENERATE__), use it directly
    if (!url.startsWith('__GENERATE__')) { 
      console.log('[ImageBubble] Direct image URL provided');
      setImgSrc(url); 
      setStatus('loading'); 
      return; 
    }
    
    const rawPrompt = url.replace('__GENERATE__', '');
    console.log('[ImageBubble] Extracted prompt:', rawPrompt);
    
    let prog = 0;
    const ticker = setInterval(() => { prog = Math.min(prog + 1, 90); setProgress(prog); }, 600);
    
    try {
      // Call backend API for image generation via orchestrator
      console.log('[ImageBubble] Calling generateImageViaOrchestrator...');
      const { generateImageViaOrchestrator } = await import('../lib/aiOrchestratorBridge');
      const result = await generateImageViaOrchestrator(rawPrompt);
      clearInterval(ticker); 
      setProgress(90);
      
      console.log('[ImageBubble] Generation successful:', result);
      setImgSrc(result.imageUrl); 
      setProviderLabel(`${result.model} (${result.provider})`); 
      setStatus('loading');
      if (onImageReady && typeof msgIndex === 'number') onImageReady(msgIndex, result.imageUrl, result.model);
    } catch (err: any) {
      clearInterval(ticker);
      console.error('[ImageBubble] Generation failed:', err);
      
      // Direct fallback to Pollinations (bypass orchestrator)
      console.log('[ImageBubble] Using direct Pollinations fallback');
      const { buildPollinationsImageUrl } = await import('../lib/imageService');
      const directUrl = buildPollinationsImageUrl(rawPrompt);
      console.log('[ImageBubble] Fallback URL:', directUrl);
      
      setProgress(90);
      setImgSrc(directUrl); 
      setProviderLabel('flux via pollinations (direct)'); 
      setStatus('loading');
      if (onImageReady && typeof msgIndex === 'number') onImageReady(msgIndex, directUrl, 'flux');
    }
  }, [url, msgIndex, onImageReady]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    generate(0);
    return () => { abortRef.current?.abort(); };
  }, [generate]);

  const handleRetry = () => { const next = retryCount + 1; setRetryCount(next); generate(next); };

  // Draw text overlay on canvas after image loads
  const handleImgLoad = useCallback(() => {
    setStatus('loaded');
    setProgress(100);
    if (!overlayMeta || !imgSrc) return;

    const drawTextOn = (dataUrl: string) => {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = () => {
        canvas.width  = img.naturalWidth  || img.width  || 1024;
        canvas.height = img.naturalHeight || img.height || 1024;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const W = canvas.width, H = canvas.height;
        const fontSize = Math.max(36, Math.round(W * 0.058));
        const fontStyle = `${overlayMeta.italic ? 'italic ' : ''}${overlayMeta.bold !== false ? 'bold ' : ''}${fontSize}px ${overlayMeta.fontFamily || '"Segoe UI", Arial, sans-serif'}`;
        ctx.font = fontStyle;
        ctx.textAlign = 'center';
        const text = overlayMeta.text;
        const metrics = ctx.measureText(text);
        const textW = metrics.width + 60;
        const textH = fontSize + 40;
        let textY: number, bgY: number;
        if (overlayMeta.position === 'top') { bgY = 16; textY = bgY + textH - 16; }
        else if (overlayMeta.position === 'center') { bgY = H/2 - textH/2; textY = H/2 + fontSize/3; }
        else { bgY = H - textH - 16; textY = H - 24; }
        // Dark background
        ctx.fillStyle = 'rgba(0,0,0,0.70)';
        ctx.beginPath();
        ctx.roundRect(W/2 - textW/2, bgY, textW, textH, 10);
        ctx.fill();
        // Stroke for legibility
        ctx.strokeStyle = 'rgba(0,0,0,0.95)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, W/2, textY);
        // Fill text
        ctx.fillStyle = overlayMeta.color || '#ffffff';
        ctx.fillText(text, W/2, textY);
        setFinalSrc(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { /* keep original */ };
      img.src = dataUrl;
    };

    // If already base64/data URL draw directly, else convert via fetchImageAsBase64
    if (imgSrc.startsWith('data:')) {
      drawTextOn(imgSrc);
    } else {
      // Fetch image as base64 to bypass CORS for canvas operations
      fetchImageAsBase64(imgSrc)
        .then(dataUrl => { if (dataUrl?.startsWith('data:')) drawTextOn(dataUrl); })
        .catch(() => { /* overlay failed, keep original */ });
    }
  }, [imgSrc, overlayMeta]);
  const handleImgError = useCallback(async () => {
    console.log('[ImageBubble] Image load error. Current src:', imgSrc);
    
    if (!imgSrc) { 
      setStatus('error'); 
      setErrorMsg('No image URL generated');
      return; 
    }
    
    // If it's an HTTP URL that failed, try alternative services
    if (imgSrc.startsWith('http')) {
      console.log('[ImageBubble] HTTP image failed, trying alternatives...');
      
      // Try fetching through proxy
      try {
        const proxied = await fetchImageAsBase64(imgSrc);
        if (proxied) { 
          console.log('[ImageBubble] Proxy fetch successful');
          setImgSrc(proxied); 
          setStatus('loading'); 
          return; 
        }
      } catch (err) {
        console.error('[ImageBubble] Proxy fetch failed:', err);
      }
      
      // If original URL was Pollinations and failed, try without some parameters
      if (imgSrc.includes('pollinations.ai')) {
        const rawPrompt = url.replace('__GENERATE__', '');
        if (rawPrompt && retryCount < 3) {
          console.log('[ImageBubble] Retrying with simplified Pollinations URL...');
          const next = retryCount + 1;
          setRetryCount(next);
          
          // Try simpler URL format
          const simpleUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(rawPrompt)}?width=1024&height=1024&seed=${Date.now()}`;
          console.log('[ImageBubble] Simple URL:', simpleUrl);
          setImgSrc(simpleUrl);
          setStatus('loading');
          return;
        }
      }
    }
    
    // If it's SVG fallback that failed, show error
    if (imgSrc?.startsWith('data:image/svg+xml')) { 
      setImgSrc(buildLocalPlaceholder(prompt)); 
      setStatus('loading'); 
      return; 
    }
    
    // Last resort: show error
    setStatus('error'); 
    setErrorMsg('Image generation service temporarily unavailable. Please try again.');
    console.error('[ImageBubble] All image generation attempts failed');
  }, [imgSrc, url, retryCount, buildLocalPlaceholder, prompt]);

  const handleDownload = useCallback((format: 'png'|'jpg') => {
    const src = finalSrc || imgSrc;
    if (!src) return;
    if (src.startsWith('data:')) { const link = document.createElement('a'); link.download = `9jai-${prompt.slice(0,20).replace(/\s+/g,'-')}.${format}`; link.href = src; link.click(); return; }
    const canvas = document.createElement('canvas'); const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; const ctx = canvas.getContext('2d')!; if (format === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); } ctx.drawImage(img,0,0); const link = document.createElement('a'); link.download = `9jai-${prompt.slice(0,20).replace(/\s+/g,'-')}.${format}`; link.href = canvas.toDataURL(format==='jpg'?'image/jpeg':'image/png',0.95); link.click(); };
    img.src = src;
  }, [finalSrc, imgSrc, prompt]);

  // Display: use finalSrc (with text overlay) when available, else imgSrc
  const displaySrc = finalSrc || imgSrc;

  return (
    <div className="max-w-[92%] rounded-2xl overflow-hidden border border-[#008751]/30 shadow-lg bg-[#07110d]">
      {(status === 'generating' || status === 'loading') && <CinematicImageLoader prompt={prompt} progress={progress} provider={providerLabel} />}
      {imgSrc && <img src={imgSrc} alt={prompt} className="hidden" onLoad={handleImgLoad} onError={handleImgError} />}
      {status === 'loaded' && displaySrc && <img src={displaySrc} alt={prompt} className="w-full h-auto block" />}
      {status === 'error' && (
        <div className="px-5 py-6 text-center">
          <p className="text-3xl mb-2">😔</p>
          <p className="text-sm font-bold text-green-300 mb-1">Image generation failed</p>
          <p className="text-xs text-green-600 mb-3">{errorMsg || 'All providers unavailable'}</p>
          <button onClick={handleRetry} className="px-4 py-2 bg-[#008751] text-white text-xs font-bold rounded-xl hover:bg-[#006b40] transition-colors">🔄 Try Again</button>
        </div>
      )}
      {status === 'loaded' && (
        <div className="px-3 py-2 bg-[#0a1a12] border-t border-[#008751]/20 flex items-center gap-2">
          <span className="text-[10px] text-green-600 font-medium flex-1 truncate">🎨 {prompt.slice(0,50)}{prompt.length>50?'...':''}</span>
          <button onClick={handleRetry} className="px-2 py-1 text-[10px] font-bold text-green-500 border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors" title="Regenerate">🔄</button>
          <button onClick={() => handleDownload('png')} className="px-2 py-1 text-[10px] font-bold text-[#00ff88] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">⬇ PNG</button>
          <button onClick={() => handleDownload('jpg')} className="px-2 py-1 text-[10px] font-bold text-[#00ff88] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">⬇ JPG</button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function GeneralAssistant({ user, isAdmin, currentSessionId, onOpenLibrary }: GeneralAssistantProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState('');
  const [placeholderText, setPlaceholderText] = useState(HOMEPAGE_PLACEHOLDERS[0]);
  const [messages, setMessages] = useState<(ChatMessage & { isNew?: boolean; imagePrompt?: string; imgType?: 'map'|'flag'|'ai'|'video'; imgLabel?: string; mapPlace?: string; isNigeriaMap?: boolean; mapFrom?: string; mapTo?: string; mapMode?: 'search'|'directions' })[]>([]);
  const [theme, setTheme] = useState(loadSavedTheme());
  const [isBusy, setIsBusy] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [currentSpokenText, setCurrentSpokenText] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState('nosa');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [showVision, setShowVision] = useState(false);
  const [visionMode, setVisionMode] = useState<'vision' | 'ocr'>('vision');
  const [selectedLanguage, setSelectedLanguage] = useState(() => getConversationLanguageContext() || 'pcm');
  const [logoState, setLogoState] = useState<'idle'|'processing'|'listening'|'speaking'|'success'|'error'|'startup'|'vision'|'ocr'|'translation'|'image'|'video'|'document'>('idle');
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);
  // Live refs for speaker state — avoids stale closures in streaming loop
  const speakerEnabledRef   = useRef(false);
  const isSpeakingNowRef    = useRef(false);
  speakerEnabledRef.current = speakerEnabled;
  isSpeakingNowRef.current  = isSpeakingNow;

  // ── Save message to Firestore ────────────────────────────────────────────
  const saveToFirestore = useCallback(async (userMsg: string, aiMsg: string) => {
    if (!user?.uid) return;
    try {
      await addDoc(collection(db, 'chat_history'), {
        userId: user.uid,
        userEmail: user.email || '',
        sessionId: sessionIdRef.current,
        userMessage: userMsg,
        aiResponse: aiMsg,
        language: getConversationLanguageContext() || 'pcm',
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
      });
    } catch (e) {
      // Silently ignore — localStorage is the fallback
    }
  }, [user]);
  const processedPromptRef = useRef<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{ name: string; type: string; preview?: string; content?: string }[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const stoppedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastAIResponseRef = useRef<string>('');
  const historyRef = useRef<{ role: 'system'|'user'|'assistant'; content: string }[]>([]);

  // ── Auto-learning hook (monitors for corrections and learns from conversations) ────
  useAutoLearning(messages, selectedLanguage, user?.uid);

  useEffect(() => { applyTheme(theme); }, [theme]);

  // Startup animation — play once on mount
  useEffect(() => {
    const t = setTimeout(() => setLogoState('idle'), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let index = 0;
    const interval = window.setInterval(() => { index = (index + 1) % HOMEPAGE_PLACEHOLDERS.length; setPlaceholderText(HOMEPAGE_PLACEHOLDERS[index]); }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  const rebuildSystemPrompt = useCallback(async () => {
    const uid = user?.uid ?? 'anonymous';
    const lc = buildLearningContext(uid);
    const pc = buildPersonalizationContext(uid);
    const lang = getConversationLanguageContext() || 'pcm';

    // Build system prompt with self-aware AI capabilities
    const systemPrompt = await buildGeneralSystemPrompt(lc, pc, lang);

    if (historyRef.current.length && historyRef.current[0].role === 'system') {
      historyRef.current[0].content = systemPrompt;
    } else {
      historyRef.current.unshift({ role: 'system', content: systemPrompt });
    }
  }, [user?.uid]);

  // Initialize providers and system prompt on mount
  useEffect(() => {
    initializeDefaultProviders();
    rebuildSystemPrompt();
  }, [rebuildSystemPrompt]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    if (!currentSessionId) {
      setMessages([]);
      historyRef.current = [];
      rebuildSystemPrompt();
      return;
    }

    const session = getSessionById(user.uid, currentSessionId);
    if (!session) return;
    sessionIdRef.current = session.id;
    const restoredMessages = session.messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role === 'user' ? 'user' as const : 'model' as const,
        content: String(message.content || ''),
        timestamp: Date.now(),
        isNew: false,
      }));
    setMessages(restoredMessages);
    historyRef.current = session.messages.map((message) => ({
      role: message.role === 'user' ? 'user' as const : 'assistant' as const,
      content: String(message.content || ''),
    }));
    rebuildSystemPrompt();
  }, [currentSessionId, user?.uid, rebuildSystemPrompt]);

  useEffect(() => {
    let mounted = true;
    (async () => { try { await initLocationContext(); if (mounted) rebuildSystemPrompt(); } catch { } })();
    return () => { mounted = false; };
  }, [rebuildSystemPrompt]);

  const scrollToBottom = useCallback(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, []);
  const updateMessageImage = useCallback((index: number, src: string) => {
    if (!src) return;
    // Accept data: or http(s) images and normalize to __IMAGE__ sentinel so messages render consistently
    const normalized = src.startsWith('__IMAGE__') || src.startsWith('__GENERATE__') ? src : `__IMAGE__${src}`;
    setMessages(prev => prev.map((m, i) => i !== index ? m : { ...m, content: normalized, timestamp: m.timestamp || Date.now() } as any));
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setTimeout(scrollToBottom, 80);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [scrollToBottom]);
  useEffect(() => {
    if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`; }
  }, [input]);

  const handleStop = useCallback(() => {
    stoppedRef.current = true; abortRef.current?.(); stopNigerianSpeech(); stopSpeaking();
    setIsStreaming(false); setIsBusy(false); setLogoState('idle');
    // Only persist partial text if there's content — don't add if empty
    if (streamingContent.trim()) {
      setMessages(prev => [...prev, { role: 'model' as const, content: streamingContent, timestamp: Date.now(), isNew: false }]);
    }
    setStreamingContent('');
  }, [streamingContent]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);
    for (const file of Array.from(files)) {
      try {
        // Use the centralized processor to produce a rich ProcessedFile (preview, extractedText, hints)
        const pf = await processFile(file as File);
        setPendingFiles(prev => [...prev, { name: pf.name, type: pf.type, preview: pf.preview, content: pf.extractedText, size: pf.size }]);
      } catch (err) {
        // Fallback: lightweight entry
        setPendingFiles(prev => [...prev, { name: file.name, type: 'file' }]);
      }
    }
  }, []);

  const formatImageFailureMessage = useCallback((errorMessage?: string) => {
    const msg = errorMessage || 'unknown error';
    if (/IMAGE_TOO_LARGE|too large for direct Vision analysis|too large for OCR/i.test(msg)) {
      return 'This image is too large for direct analysis. Please resize or compress it and try again.';
    }
    return `Image analysis failed: ${msg}`;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && pendingFiles.length === 0) || isBusy) return;
    const userMessage = text.trim();
    setInput(''); setIsBusy(true); stoppedRef.current = false; setLogoState('processing');

    const timeQuery = /\b(current\s+time|what\s+time|time\s+now|what\s+time\s+is\s+it|time\s+be\s+am|clock)\b/i.test(userMessage);
    const weatherQuery = /\b(weather|forecast|rain|temperature|sunny|humid|storm|cloudy|cold|hot)\b/i.test(userMessage) && !/\b(generate|image|photo|logo|draw)\b/i.test(userMessage);

    if (timeQuery) {
      const languageCode = getConversationLanguageContext() || selectedLanguage || 'pcm';
      const response = {
        en: `Your local time is ${getDeviceTimeText()}.`,
        pcm: `Your local time dey: ${getDeviceTimeText()}.`,
        yo: `Aago ibẹ̀ yín ni ${getDeviceTimeText()}.`,
        ig: `Oge gị na mpaghara gị bụ ${getDeviceTimeText()}.`,
        ha: `Lokacin kujerarka shine ${getDeviceTimeText()}.`,
        edo: `Ẹghẹ gha rẹvbe ${getDeviceTimeText()}.`,
      }[languageCode] || `Your local time is ${getDeviceTimeText()}.`;
      setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }, { role: 'model', content: response, timestamp: Date.now(), isNew: true }]);
      historyRef.current.push({ role: 'user', content: userMessage });
      historyRef.current.push({ role: 'assistant', content: response });
      setIsBusy(false);
      setLogoState('idle');
      return;
    }

    const classifiedIntent = classifyUserIntent(userMessage);

    // If multi-intent detected, attempt to execute the multi-step workflow
    if ((classifiedIntent.secondaryCapabilities && classifiedIntent.secondaryCapabilities.length > 0) || (pendingFiles && pendingFiles.length > 0)) {
      try {
        const { orchestrateMultiIntent } = await import('../lib/multiIntentExecutor');
        const fileContextParts = pendingFiles || [];
        const multiResult = await orchestrateMultiIntent(userMessage, classifiedIntent, fileContextParts as any);
        if (multiResult && multiResult.messages && multiResult.messages.length > 0) {
          // Append all returned messages to chat history and finish
          for (const m of multiResult.messages) {
            setMessages(prev => [...prev, { role: m.role, content: m.content, timestamp: Date.now(), isNew: true }]);
            historyRef.current.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
          }
          setIsBusy(false);
          setLogoState('success');
          setTimeout(() => setLogoState('idle'), 1200);
          return;
        }
      } catch (err) {
        console.warn('[GeneralAssistant] multi-intent orchestration failed:', err);
        // Fall through to single-capability handling below
      }
    }

    if (classifiedIntent.capability === 'language' && classifiedIntent.targetLanguage) {
      const target = classifiedIntent.targetLanguage.toLowerCase();
      const codeMap: Record<string, string> = { english: 'en', edo: 'edo', yoruba: 'yo', igbo: 'ig', hausa: 'ha', pidgin: 'pcm', 'nigerian pidgin': 'pcm' };
      const normalized = codeMap[target] || target;
      setSelectedLanguage(normalized);
      setConversationLanguageContext(normalized);
      rebuildSystemPrompt();
    }

    if (classifiedIntent.capability === 'search') {
      setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
      try {
        const searchResult = await proxySearch(userMessage);
        const resultSummary = searchResult.results.slice(0, 3).map((result, idx) => `${idx + 1}. ${result.title}\n${result.snippet}${result.url && result.url !== '#' ? `\n${result.url}` : ''}`).join('\n\n');
        const response = `🔎 Search results for “${userMessage}”\n\n${resultSummary || 'No live results were returned in this environment.'}`;
        setMessages(prev => [...prev, { role: 'model', content: response, timestamp: Date.now(), isNew: true }]);
        historyRef.current.push({ role: 'user', content: userMessage });
        historyRef.current.push({ role: 'assistant', content: response });
        setIsBusy(false);
        setLogoState('idle');
        return;
      } catch (searchError) {
        console.warn('[GeneralAssistant] search intent routing failed:', searchError);
      }
    }

    if (classifiedIntent.capability === 'image') {
      setLogoState('image');
      try {
        const generatedImage = await proxyImage(userMessage);
        if (generatedImage?.imageUrl) {
          const imageResponse = `__IMAGE__${generatedImage.imageUrl}`;
          setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }, { role: 'model', content: imageResponse, timestamp: Date.now(), isNew: true }]);
          historyRef.current.push({ role: 'user', content: userMessage });
          historyRef.current.push({ role: 'assistant', content: imageResponse });
          setIsBusy(false);
          setLogoState('success');
          setTimeout(() => setLogoState('idle'), 2000);
          return;
        }
      } catch (imageError) {
        console.warn('[GeneralAssistant] image intent routing failed:', imageError);
      }
    }

    if (weatherQuery) {
      const languageCode = getConversationLanguageContext() || selectedLanguage || 'pcm';
      const weatherReport = await formatWeatherReport();
      const localizedWeather = getLocalFallbackResponse(userMessage, languageCode);
      const response = weatherReport || localizedWeather;
      setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }, { role: 'model', content: response, timestamp: Date.now(), isNew: true }]);
      historyRef.current.push({ role: 'user', content: userMessage });
      historyRef.current.push({ role: 'assistant', content: response });
      setIsBusy(false);
      setLogoState('idle');
      return;
    }
    
    // Check for unavailable feature requests
    if (userMessage) {
      const unavailableCheck = await detectUnavailableFeatureRequest(userMessage);
      if (unavailableCheck) {
        const safeMessage = sanitizeDisplayText(unavailableCheck.message);
        setMessages(prev => [...prev, 
          { role: 'user', content: userMessage, timestamp: Date.now() },
          { role: 'model', content: safeMessage, timestamp: Date.now(), isNew: true }
        ]);
        historyRef.current.push({ role: 'user', content: userMessage });
        historyRef.current.push({ role: 'assistant', content: safeMessage });
        setIsBusy(false);
        setLogoState('idle');
        return;
      }
    }
    
    try {
      const currentLang = getConversationLanguageContext() || selectedLanguage || 'pcm';
      const explicitLanguageSwitch = /\b(speak|talk|switch to|use)\s+(english|pidgin|yoruba|igbo|hausa|edo)\b/i.test(userMessage || '');

      if (!explicitLanguageSwitch && currentLang && ['en', 'yo', 'ig', 'ha', 'edo'].includes(currentLang)) {
        // Preserve the user's explicit language selection during the conversation.
        // Automatic detection should only be used before a language has been chosen.
      } else {
        const detected = await detectLanguageFromInput(userMessage || '');
        if (detected.code !== currentLang && detected.confidence >= 0.55) { setConversationLanguageContext(detected.code); setSelectedLanguage(detected.code); rebuildSystemPrompt(); }
        else if (shouldAutoSwitch(detected.confidence)) { setConversationLanguageContext(detected.code); setSelectedLanguage(detected.code); rebuildSystemPrompt(); }
      }
    } catch (e) {}
    let fileContext = '';
    const filePreviews = [...pendingFiles];
    setPendingFiles([]);
    if (filePreviews.length > 0) {
      const contextParts: string[] = [];
      for (const f of filePreviews) {
        if (f.type === 'image' && f.preview) {
          setMessages(prev => [...prev, { role: 'model', content: `🔍 Analyzing image: **${f.name}**…`, timestamp: Date.now(), isNew: true }]);
          try {
            const isOcrRequest = /\b(read|ocr|extract text|text in|what does.*say)\b/i.test(userMessage);
            
            // Default detailed vision prompt focusing on main subject
            const defaultVisionPrompt = `Analyze this image with FOCUS ON THE MAIN SUBJECT/OBJECT, not the background.

PRIORITY ANALYSIS:
1. Main Subject: What is the primary item/object?
2. Text & Labels: Read ALL visible text, labels, brand names
3. Product Details (if applicable): name, manufacturer, ingredients, dosage, expiry date, country of origin, usage, warnings, codes
4. Physical Description: size, color, shape, condition
5. Background: only if contextually important

Extract COMPLETE and DETAILED information from any text, labels, or packaging visible.`;
            
            // Use orchestrator for both OCR and Vision
            const { extractTextViaOrchestrator, analyzeImageViaOrchestrator } = await import('../lib/aiOrchestratorBridge');
            
            if (isOcrRequest) {
              // OCR: Just extract and display text, no AI elaboration
              const ocrResult = await extractTextViaOrchestrator(f.preview);
              const extractedText = ocrResult.text?.trim() || '';
              
              if (extractedText) {
                // Format OCR result professionally and concisely
                const confidence = ocrResult.confidence ? ` (${Math.round(ocrResult.confidence * 100)}% confidence)` : '';
                const resultText = `📝 Text Extracted${confidence}:\n\n${extractedText}`;
                
                setMessages(prev => { 
                  const updated = [...prev]; 
                  const lastIdx = updated.length - 1; 
                  if (updated[lastIdx]?.content?.startsWith('🔍 Analyzing image:')) { 
                    updated[lastIdx] = { ...updated[lastIdx], content: resultText, isNew: true }; 
                  } 
                  return updated; 
                });
                historyRef.current.push({ role: 'user', content: `[Image: ${f.name}]` });
                historyRef.current.push({ role: 'assistant', content: resultText });
                lastAIResponseRef.current = resultText;
              } else {
                const noTextMsg = '❌ No text found in the image. Please ensure the image contains clear, readable text.';
                setMessages(prev => { 
                  const updated = [...prev]; 
                  const lastIdx = updated.length - 1; 
                  if (updated[lastIdx]?.content?.startsWith('🔍 Analyzing image:')) { 
                    updated[lastIdx] = { ...updated[lastIdx], content: noTextMsg, isNew: true }; 
                  } 
                  return updated; 
                });
              }
            } else {
              // Vision: Analyze and describe
              const result = await analyzeImageViaOrchestrator(
                f.preview,
                userMessage ? `User says: "${userMessage}". Answer their question about this image by focusing on the main subject/object.` : defaultVisionPrompt
              );
              const resultText = sanitizeVisionResponse(result.text);
              setMessages(prev => { 
                const updated = [...prev]; 
                const lastIdx = updated.length - 1; 
                if (updated[lastIdx]?.content?.startsWith('🔍 Analyzing image:')) { 
                  updated[lastIdx] = { ...updated[lastIdx], content: resultText, isNew: true }; 
                } 
                return updated; 
              });
              historyRef.current.push({ role: 'user', content: `[Image: ${f.name}]` });
              historyRef.current.push({ role: 'assistant', content: resultText });
              lastAIResponseRef.current = resultText;
            }
            
            setIsBusy(false); setLogoState('success'); setTimeout(() => setLogoState('idle'), 2000); return;
          } catch (e: any) {
            const friendlyError = formatImageFailureMessage(e?.message);
            contextParts.push(`[Image uploaded: ${f.name} — ${friendlyError}]`);
            setMessages(prev => prev.filter(m => !m.content?.startsWith('🔍 Analyzing image:')));
            setMessages(prev => [...prev, { role: 'model', content: friendlyError, timestamp: Date.now(), isNew: true }]);
          }
        } else if (f.content) { contextParts.push(`[Attached file: ${f.name}]\n${f.content}`); }
        else { contextParts.push(`[Attached: ${f.name}]`); }
      }
      fileContext = contextParts.length > 0 ? '\n\n' + contextParts.join('\n\n') : '';
    }
    const displayMessage = userMessage || `📎 ${filePreviews.map(f => f.name).join(', ')}`;
    
    // Check for MAP requests FIRST (before image detection)
    // Exclude list/spreadsheet requests that happen to contain location words
    const isListOrSpreadsheet = isSpreadsheetRequest(userMessage || '');
    const isMapQuery = !isListOrSpreadsheet && userMessage && (
      /\b(map of|show.*\bmap\b|direction from|route from|navigate to|where is .{3,} on (a )?map|how to get to)\b/i.test(userMessage.toLowerCase())
    );
    
    if (isMapQuery) {
      // Add the user message
      setMessages(prev => [...prev, { role: 'user', content: displayMessage, timestamp: Date.now() }]);
      
      const lower = userMessage.toLowerCase();
      const fromMatch = lower.match(/from\s+([^to]+?)\s+to/i);
      const toMatch = lower.match(/to\s+(.+?)(?:\s*$|\s+in\s+|\s+,)/i);
      
      let mapMode: 'search' | 'directions' = 'search';
      let mapPlace = '';
      let mapFrom = '';
      let mapTo = '';
      
      if (fromMatch && toMatch) {
        mapMode = 'directions';
        mapFrom = fromMatch[1].trim();
        mapTo = toMatch[1].trim();
        mapPlace = `${mapFrom} to ${mapTo}`;
      } else {
        const place = userMessage
          .replace(/map\s+of\s+/gi, '')
          .replace(/where\s+is\s+/gi, '')
          .replace(/location\s+of\s+/gi, '')
          .replace(/show\s+me\s+/gi, '')
          .replace(/direction\s+to\s+/gi, '')
          .trim() || 'Nigeria';
        mapPlace = place;
        mapMode = 'search';
      }
      
      const isNigeriaMap = mapPlace.toLowerCase().includes('nigeria');
      const contentPayload = '__MAP__';
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: contentPayload, 
        timestamp: Date.now(), 
        imgType: 'map',
        imgLabel: `🗺️ ${mapMode === 'directions' ? `Directions from ${mapFrom} to ${mapTo}` : `Map of ${mapPlace}`}`,
        mapPlace,
        isNigeriaMap,
        mapFrom,
        mapTo,
        mapMode,
        isNew: true 
      }]);
      
      historyRef.current.push({ role: 'user', content: userMessage });
      historyRef.current.push({ role: 'assistant', content: `Showing interactive map for: ${mapPlace}` });
      
      setIsBusy(false);
      setLogoState('success');
      setTimeout(() => setLogoState('idle'), 1000);
      setTimeout(scrollToBottom, 100);
      return;
    }
    
    // Now check for image requests using OLD WORKING SYSTEM
    if (userMessage && isImageRequest(userMessage)) {
      setMessages(prev => [...prev, { role: 'user', content: displayMessage, timestamp: Date.now() }]);
      const prompt = extractImagePrompt(userMessage);
      const textOverlay = extractTextOverlay(userMessage);
      const isVideoRequest = /\b(video|animation|animate|movie|clip|motion|moving)\b/i.test(userMessage);
      setLogoState(isVideoRequest ? 'video' : 'image');

      // Include text overlay info in the prompt if present
      const fullPrompt = textOverlay ? `${prompt} | overlay_text: ${textOverlay.overlayText} | overlay_position: ${textOverlay.position}` : prompt;
      const contentPayload = `__GENERATE__${fullPrompt}`;
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: contentPayload, 
        timestamp: Date.now(), 
        imagePrompt: prompt,
        imgType: isVideoRequest ? 'video' : 'ai',
        imgLabel: `🎨 ${prompt}`,
        isNew: true 
      }]);
      
      historyRef.current.push({ role: 'user', content: userMessage });
      historyRef.current.push({ role: 'assistant', content: contentPayload });
      
      setIsBusy(false);
      setLogoState('success');
      setTimeout(() => setLogoState('idle'), 2000);
      setTimeout(scrollToBottom, 100);
      return;
    }
    
    const appCommand = parseAppCommand(userMessage);
    if (appCommand) {
      setInput(''); setMessages(prev => [...prev, { role: 'user', content: displayMessage, timestamp: Date.now() }]);
      if (appCommand.command === 'clearChat') { historyRef.current = historyRef.current.filter(item => item.role === 'system'); setMessages([{ role: 'model', content: 'Chat history don clear. We fit start again fresh now.', timestamp: Date.now(), isNew: true }]); setIsBusy(false); setLogoState('idle'); return; }
      if (appCommand.command === 'setTheme' && appCommand.value) { const appliedTheme = applyTheme(appCommand.value); setTheme(appliedTheme); setMessages(prev => [...prev, { role: 'model', content: `Theme don change to ${appliedTheme}.`, timestamp: Date.now(), isNew: true }]); setIsBusy(false); setLogoState('idle'); return; }
      if (appCommand.command === 'weather') {
        const weatherReport = await formatWeatherReport();
        setMessages(prev => [...prev, { role: 'model', content: weatherReport, timestamp: Date.now(), isNew: true }]);
        setIsBusy(false); setLogoState('idle'); return;
      }
      if (appCommand.command === 'openLanguages') { navigate('/languages'); setMessages(prev => [...prev, { role: 'model', content: 'I don open the language menu for you.', timestamp: Date.now(), isNew: true }]); setIsBusy(false); setLogoState('idle'); return; }
      if (appCommand.command === 'help') { setMessages(prev => [...prev, { role: 'model', content: getThemeHelpText(), timestamp: Date.now(), isNew: true }]); setIsBusy(false); setLogoState('idle'); return; }
    }
    setMessages(prev => [...prev, { role: 'user', content: displayMessage, timestamp: Date.now() }]);

    // Inject strong format instructions for spreadsheet/document requests
    let messageToSend = (userMessage + fileContext) || displayMessage;
    if (userMessage && isSpreadsheetRequest(userMessage)) {
      messageToSend = `${userMessage}\n\nMANDATORY: Respond ONLY with a spreadsheet block. Choose column headers that are SPECIFIC and MEANINGFUL for this exact data (NOT generic "No/Name/Value/Score"). Example for herbs: ["No","Herb Name","Scientific Name","Traditional Use"]. Example for FIFA: ["Year","Host Country","Winner","Runner-Up","Goals Scored"]. Example for budget: ["Category","Item","Amount (₦)","Notes"]\n\`\`\`spreadsheet\n{"title":"[specific title]","headers":["relevant","headers","here"],"rows":[[1,"data","data","data"]]}\n\`\`\`\nInclude ALL data, minimum 10 rows.`;
    } else if (userMessage && isDocumentRequest(userMessage)) {
      messageToSend = `${userMessage}\n\nMANDATORY: Respond ONLY with a document block containing the COMPLETE professional document:\n\`\`\`document\n{"title":"[title]","format":"word","content":"# [Title]\\n\\n[complete content with \\\\n for newlines]"}\n\`\`\``;
    }

    historyRef.current.push({ role: 'user', content: messageToSend });
    if (userMessage && lastAIResponseRef.current && user?.uid) {
      const intent = detectCorrectionIntent(userMessage, lastAIResponseRef.current);
      if (intent.detected) { storeCorrection(user.uid, { originalResponse: lastAIResponseRef.current, correctedResponse: userMessage, topic: 'general', language: 'en', confidence: intent.confidence, validatedBy: 1, rejectedBy: 0, source: 'user', status: 'pending' }).then(() => rebuildSystemPrompt()); }
      updateUserBehavior(user.uid, { avgMessageLength: userMessage.length, lastSeen: Date.now() });
    }
    setIsStreaming(true); setStreamingContent('');
    let fullText = ''; let stopped = false;
    abortRef.current = () => { stopped = true; stopNigerianSpeech(); };
    try {
      const convLang = getConversationLanguageContext() || selectedLanguage || 'pcm';
      for await (const chunk of unifiedChatStream(historyRef.current, 0.7)) {
        if (stopped || stoppedRef.current) break;
        fullText += chunk;
        setStreamingContent(sanitizeDisplayText(fullText));
        scrollToBottom();
        // Use ref for live value — avoids stale closure
        if (speakerEnabledRef.current && chunk) {
          if (!isSpeakingNowRef.current) {
            setIsSpeakingNow(true);
            isSpeakingNowRef.current = true;
          }
          setCurrentSpokenText(fullText);
          speakNigerian(chunk, selectedAssistantId);
        }
      }
      if (!stopped && !stoppedRef.current && speakerEnabledRef.current) speakNigerian('', selectedAssistantId);
      if (!stopped && !stoppedRef.current) {
        const convLang2 = getConversationLanguageContext() || selectedLanguage || 'pcm';
        const cleanFullText = sanitizeDisplayText(fullText);
        const phon = generatePhonetics(cleanFullText, convLang2);
        let finalTextNormalized = cleanFullText;
        try {
          if (convLang2 === 'pcm') {
            const { normalizePidginGrammar, isLikelyPidgin } = await import('../lib/pidginNormalizer');
            if (isLikelyPidgin(cleanFullText) || /\b(Tell|Give|Me|I)\b/i.test(cleanFullText)) {
              finalTextNormalized = normalizePidginGrammar(cleanFullText);
            }
          }
        } catch (e) { /* ignore normalization errors */ }
        historyRef.current.push({ role: 'assistant', content: finalTextNormalized });
        lastAIResponseRef.current = finalTextNormalized;
        // isNew: false — streaming bubble already showed this content, just persist it
        setMessages(prev => {
          // Replace the streaming bubble slot — don't add a second message
          // The streaming bubble disappears when isStreaming=false, so just add once
          return [...prev, { role: 'model', content: finalTextNormalized, timestamp: Date.now(), isNew: false, phonetics: phon } as any];
        });
        saveToFirestore(userMessage, cleanFullText);
        if (user?.uid) {
          saveChatSession(user.uid, {
            id: sessionIdRef.current,
            languageId: getConversationLanguageContext() || 'pcm',
            languageName: mapCodeToName(getConversationLanguageContext() || 'pcm'),
            messages: [...historyRef.current.filter(m => m.role !== 'system')],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title: userMessage.slice(0, 40) || 'Chat',
          });
        }
      }
    } catch (err: any) {
      if (!stopped && !stoppedRef.current) {
        const language = getConversationLanguageContext() || selectedLanguage || 'en';
        const fallback = userMessage ? getLocalFallbackResponse(userMessage, language) : 'Network busy right now. Please try again.';
        setMessages(prev => [...prev, { role: 'model', content: fallback, timestamp: Date.now(), isNew: true }]);
      }
    } finally {
      abortRef.current = null; setIsStreaming(false); setStreamingContent(''); setIsBusy(false);
      setLogoState('success'); setTimeout(() => setLogoState('idle'), 2000); setTimeout(scrollToBottom, 100);
      // Mark speaking as done — cube stays visible until speaker is turned off
      setTimeout(() => { setIsSpeakingNow(false); }, 1500);
    }
  }, [isBusy, pendingFiles, scrollToBottom, speakerEnabled, selectedAssistantId, rebuildSystemPrompt, navigate, user?.uid]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextPrompt = params.get('prompt');
    if (!nextPrompt) { processedPromptRef.current = null; return; }
    if (processedPromptRef.current === nextPrompt) return;
    processedPromptRef.current = nextPrompt;
    setInput(nextPrompt);
    const timer = window.setTimeout(() => { sendMessage(nextPrompt); }, 120);
    const cleanParams = new URLSearchParams(location.search);
    cleanParams.delete('prompt');
    window.history.replaceState({}, '', `${window.location.pathname}${cleanParams.toString()?`?${cleanParams.toString()}`:''}${window.location.hash}`);
    return () => window.clearTimeout(timer);
  }, [location.search, sendMessage]);

  const handleSubmit = useCallback((e: React.FormEvent) => { e.preventDefault(); sendMessage(input); }, [input, sendMessage]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }, [input, sendMessage]);

  const handleSidebarItem = (id: string) => {
    setActiveSection(id);
    if (id === 'chat') { setMessages([]); historyRef.current = historyRef.current.filter(m => m.role === 'system'); setLogoState('idle'); }
    else if (id === 'image') { setLogoState('image'); sendMessage('generate image of a beautiful Nigerian sunset landscape'); }
    else if (id === 'video') { setLogoState('video'); sendMessage('create a video of Lagos city lights at night'); }
    else if (id === 'vision') { setLogoState('vision'); setShowVision(true); }
    else if (id === 'ocr') { setLogoState('ocr'); setMessages(prev => [...prev, { role: 'model', content: '🔎 OCR mode: Upload an image and I will extract all text from it. Click the 📎 attach button to upload.', timestamp: Date.now(), isNew: true }]); }
    else if (id === 'voice') { setLogoState('listening'); setMessages(prev => [...prev, { role: 'model', content: '🎙️ Voice mode: Click the microphone button in the input bar to start speaking.', timestamp: Date.now(), isNew: true }]); setTimeout(() => setLogoState('idle'), 3000); }
    else if (id === 'translate') { setLogoState('translation'); setInput('translate to yoruba: '); setTimeout(() => inputRef.current?.focus(), 100); }
    else if (id === 'search') { setInput('search for '); setTimeout(() => inputRef.current?.focus(), 100); }
    else if (id === 'documents') { setLogoState('document'); setMessages(prev => [...prev, { role: 'model', content: '📄 Document mode: Upload a PDF or text file using the 📎 attach button and I will analyze it for you.', timestamp: Date.now(), isNew: true }]); setTimeout(() => setLogoState('idle'), 3000); }
    else if (id === 'memory') { setMessages(prev => [...prev, { role: 'model', content: '🧠 Memory: I remember your preferences and corrections from previous conversations. You can say "forget everything" to clear my memory.', timestamp: Date.now(), isNew: true }]); }
    else if (id === 'languages') { navigate('/languages'); }
    else if (id === 'utilities') { navigate('/utilities'); }
    else if (id === 'settings') { setMessages(prev => [...prev, { role: 'model', content: '⚙️ Settings: Say "change theme dark", "change theme light", "speak yoruba", "speak english", or "speak pidgin" to customize the app.', timestamp: Date.now(), isNew: true }]); }
    else if (id === 'about') { setMessages(prev => [...prev, { role: 'model', content: '🇳🇬 9ja AI — Africa\'s smartest AI assistant\n\nBuilt by Tomega Technology Limited\n© 2026 · Thompson Obosa\n\nFeatures: Chat · Image Generation · Video · Vision · OCR · Translation · Voice · Nigerian Languages · Web Search · Documents · Memory', timestamp: Date.now(), isNew: true }]); }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col h-screen bg-gradient-to-br from-[#0a2818] to-[#051f16] text-white overflow-hidden">
      
      {/* Speaker Cube — fullscreen animated visualizer when speaker is ON */}
      <SpeakerCube
        isActive={speakerEnabled}
        isSpeaking={isSpeakingNow}
        isBusy={isBusy}
        text={currentSpokenText}
        onVoiceInput={(text) => sendMessage(text)}
        onEnd={() => {
          stopNigerianSpeech();
          setIsSpeakingNow(false);
          setCurrentSpokenText('');
          setSpeakerEnabled(false);
        }}
      />

      {/* Network background effects */}
      <NetworkBackground />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <label htmlFor="language-selector" className="sr-only">Response language</label>
        <div className="rounded-full border border-[#008751]/30 bg-[#071a10]/90 px-2 py-1.5 backdrop-blur-sm shadow-[0_0_15px_rgba(0,135,81,0.12)]">
          <select
            id="language-selector"
            value={selectedLanguage}
            onChange={(event) => {
              const code = normalizeLanguageCode(event.target.value);
              setSelectedLanguage(code);
              setConversationLanguageContext(code);
              rebuildSystemPrompt();
              if (code === 'edo') {
                setInput((current) => current.trim() ? current : 'Translate this message into Edo language');
              }
            }}
            className="min-w-[120px] appearance-none rounded-full border border-[#008751]/20 bg-transparent px-3 py-1.5 pr-8 text-xs font-medium text-[#dfffee] outline-none"
            aria-label="Choose response language"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code} className="bg-[#071a10] text-[#dfffee]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vision Engine modal */}
      {showVision && <VisionEngine mode={visionMode} onClose={() => setShowVision(false)} onResult={(text) => { setShowVision(false); setMessages(prev => [...prev, { role: 'model', content: text, timestamp: Date.now(), isNew: true }]); }} />}

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-full text-center px-4 pb-32">
            <div className="mb-8"><NineJALogo state={logoState} size={200} /></div>
            <h2 className="text-3xl font-normal text-white mb-2">
              {getLocalizedGreeting(user?.displayName || '', selectedLanguage || 'pcm')}
            </h2>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              // Hide the last model message while streaming — it's the same content as the streaming bubble
              const isLastModelMsg = msg.role === 'model' && idx === messages.length - 1;
              if (isStreaming && isLastModelMsg) return null;

              const isImg = msg.role === 'model' && (msg.content.startsWith('__IMAGE__') || msg.content.startsWith('__GENERATE__') || msg.content.startsWith('__MAP__') || msg.content.startsWith('__VIDEO__'));
              const imgUrl = isImg ? (msg.content.startsWith('__IMAGE__') ? msg.content.replace('__IMAGE__', '') : msg.content) : null;
              
              // Spreadsheet detection
              const spreadsheetMatch = msg.role === 'model' && msg.content.match(/```spreadsheet\n([\s\S]*?)\n```/);
              let spreadsheetData: { title: string; headers: string[]; rows: (string|number)[][] } | null = null;
              let textContent = msg.content;
              if (spreadsheetMatch) { try { spreadsheetData = JSON.parse(spreadsheetMatch[1]); textContent = msg.content.replace(/```spreadsheet\n[\s\S]*?\n```/, '').trim(); } catch {} }

              // Document detection
              const documentMatch = msg.role === 'model' && msg.content.match(/```document\n([\s\S]*?)\n```/);
              let documentData: { title: string; content: string; format?: string } | null = null;
              if (documentMatch) {
                try {
                  documentData = JSON.parse(documentMatch[1]);
                  textContent = textContent.replace(/```document\n[\s\S]*?\n```/, '').trim();
                } catch {
                  // If not valid JSON, treat the raw block as the document content
                  documentData = { title: 'Document', content: documentMatch[1] };
                  textContent = textContent.replace(/```document\n[\s\S]*?\n```/, '').trim();
                }
              }

              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {isImg ? (
                    msg.imgType === 'video' ? <VideoBubble prompt={msg.imagePrompt || 'video'} /> :
                    msg.imgType === 'map' ? <InteractiveMap initialQuery={msg.mapPlace || 'Nigeria'} mode={msg.mapMode || 'search'} from={msg.mapFrom} to={msg.mapTo} /> :
                    <ImageBubble url={imgUrl || ''} originalContent={msg.content} prompt={msg.imagePrompt || 'AI image'} imgType={msg.imgType === 'flag' ? 'flag' : 'ai'} label={msg.imgLabel || `🎨 ${msg.imagePrompt}`} onImageReady={updateMessageImage} msgIndex={idx} user={user} />
                  ) : (
                    <>
                      {textContent && (msg.role === 'model' ? <TypewriterBubble content={textContent} isNew={!!msg.isNew} /> : <div className="max-w-[85%] bg-[#008751]/15 border border-[#008751]/25 px-4 py-3 rounded-2xl rounded-tr-sm text-white text-base leading-relaxed whitespace-pre-wrap">{msg.content}</div>)}
                      {spreadsheetData && <SpreadsheetViewer data={spreadsheetData} title={spreadsheetData.title} />}
                      {documentData && <DocumentViewer title={documentData.title} content={documentData.content} format={documentData.format as any} />}
                    </>
                  )}
                </motion.div>
              );
            })}

            {isStreaming && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] bg-[#0d2318] border border-[#008751]/30 px-4 py-3 rounded-2xl rounded-tl-sm text-green-100 text-base leading-[1.6] whitespace-pre-wrap shadow-[0_0_20px_rgba(0,135,81,0.1)] break-words">
                  {sanitizeDisplayText(streamingContent)}<span className="inline-block w-2 h-4 bg-[#00ff88] ml-0.5 animate-pulse rounded-sm align-middle" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Thinking / typing indicator aligned with assistant bubble ─────────────────────────────────── */}
      <AnimatePresence>
        {isBusy && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex justify-start pb-2 px-4">
            <div className="max-w-[85%] bg-[#0d1f10] border border-[#008751]/20 px-4 py-3 rounded-2xl rounded-tl-sm text-white text-base leading-relaxed whitespace-pre-wrap flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#008751] animate-bounce inline-block" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce inline-block" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#008751] animate-bounce inline-block" style={{ animationDelay: '300ms' }} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#00d37a] font-medium">9JAI is thinking…</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-5 pt-2 bg-[#050e05]">
        <AnimatePresence>
          {pendingFiles.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-1.5 mb-2">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#008751]/10 border border-[#008751]/20 rounded-xl text-xs font-semibold text-[#008751]">
                  {f.type === 'image' && f.preview ? <img src={f.preview} className="w-4 h-4 rounded object-cover" alt="" /> : <ImageIcon size={12} />}
                  <span className="max-w-[100px] truncate">{f.name}</span>
                  <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}><X size={11} /></button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <input ref={fileInputRef} type="file" multiple accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2 p-2 bg-[#0d1f10] border border-[#008751]/20 rounded-2xl flex gap-2">
              {[{ icon: <ImageIcon size={16} />, label: 'Image', accept: 'image/*' }, { icon: <FileText size={16} />, label: 'Document', accept: '.pdf,.doc,.docx,.txt,.md,.csv' }, { icon: <Music size={16} />, label: 'Audio', accept: 'audio/*' }].map(item => (
                <button key={item.label} onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = item.accept; fileInputRef.current.click(); } setShowAttachMenu(false); }} className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[#008751] hover:bg-[#008751]/10 text-xs font-bold transition-colors">{item.icon}{item.label}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pill bar - reduced size on mobile */}
        <div className="flex items-end gap-1.5 sm:gap-2 bg-[#0d1f10] border border-[#008751]/25 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 focus-within:border-[#008751]/50 transition-colors">
          <button type="button" onClick={() => setShowAttachMenu(v => !v)} className="shrink-0 p-1 sm:p-1.5 rounded-full text-[#008751]/50 hover:text-[#008751] transition-all"><Plus size={18} className="sm:w-5 sm:h-5" /></button>
          <button type="button" onClick={() => { setVisionMode('vision'); setShowVision(true); }} className="shrink-0 p-1.5 sm:p-2 rounded-full text-[#008751]/50 hover:text-[#008751] transition-all" title="Vision Camera"><Camera size={20} className="sm:w-[22px] sm:h-[22px]" /></button>
          <button type="button" onClick={() => { setVisionMode('ocr'); setShowVision(true); }} className="shrink-0 p-1.5 sm:p-2 rounded-full text-[#008751]/50 hover:text-[#008751] transition-all" title="OCR - Extract Text"><ScanText size={20} className="sm:w-[22px] sm:h-[22px]" /></button>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholderText} rows={1} className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder-[#008751]/30 text-white resize-none max-h-20 sm:max-h-24 overflow-y-auto caret-[#008751]" />
          <div className="shrink-0"><VoiceAssistantDropdown onVoiceInput={(text) => sendMessage(text)} onSpeakerToggle={(enabled) => { setSpeakerEnabled(enabled); if (!enabled) { setIsSpeakingNow(false); setCurrentSpokenText(''); stopNigerianSpeech(); } }} onAssistantChange={(id) => setSelectedAssistantId(id)} /></div>
          {isBusy ? (
            <button type="button" onClick={handleStop} className="shrink-0 p-1.5 sm:p-2 bg-red-500/80 text-white rounded-full active:scale-95"><Square size={14} className="sm:w-4 sm:h-4" fill="white" /></button>
          ) : (
            <button type="button" onClick={() => sendMessage(input)} disabled={!input.trim() && pendingFiles.length === 0} className="shrink-0 p-1.5 sm:p-2 bg-[#008751] text-white rounded-full hover:bg-[#00a862] transition-all disabled:opacity-30 active:scale-95"><Send size={14} className="sm:w-4 sm:h-4" /></button>
          )}
        </div>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
