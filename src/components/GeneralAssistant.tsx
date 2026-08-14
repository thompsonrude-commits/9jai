import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Square, X, Image as ImageIcon, FileText, Music, Plus, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { unifiedChatStream } from '../lib/ai';
import { speakText, stopSpeaking, VOICE_PERSONALITIES } from '../lib/voiceEngine';
import { speakNigerian, stopNigerianSpeech } from '../lib/nigerianVoice';
import { detectLanguage, setConversationLanguage, getConversationLanguage, mapCodeToName } from '../lib/language';
import { generatePhonetics } from '../lib/phonetics';
import { getSystemPromptFor } from '../lib/systemPrompts';
import {
  detectLanguageFromInput,
  shouldAutoSwitch,
  getConversationLanguageContext,
  setConversationLanguageContext,
} from '../lib/homepageLanguageRouter';
import { initLocationContext, getCachedLocationContext, getDeviceTimeText } from '../lib/locationService';
import { enhanceImagePrompt, buildEnhancedImageRequest } from '../lib/imagePromptBuilder';
import VideoPlayer from './VideoPlayer';
import { buildFinalImagePrompt, fetchImageAsBase64 } from '../lib/imageService';
import { detectTextInImage } from '../lib/ocr';
import { parseAppCommand, applyTheme, loadSavedTheme, formatWeatherReport, getThemeHelpText } from '../lib/appCommands';
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
import { proxyVision } from '../lib/aiProxy';
import VisionEngine from './VisionEngine';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { saveChatSession, getSessionById } from '../lib/sessionManager';
import { buildSelfAwarePrompt, detectUnavailableFeatureRequest } from '../lib/selfAwarePrompt';
import { initializeDefaultProviders } from '../lib/providerHealth';
import { getLocalFallbackResponse } from '../lib/fallbackResponses';

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
  const name = displayName?.trim() || 'Oga';
  const greetings: Record<string, string> = {
    en: `Welcome ${name}, how can I help you?`,
    pcm: `Welcome Oga ${name}, wetin I fit do for you?`,
    yo: `Ẹ káàbọ̀ ${name}, kí ni mo lè ṣe fún ọ?`,
    ig: `Nnọọ ${name}, Gịnị m ga-enyere gị aka?`,
    ha: `Sannu ${name}, me zan iya taimaka maka?`,
    edo: `Kọyọ ${name}, ọriẹ gbe muẹre nẹ?`,
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
  
  // Add self-aware AI capabilities
  const selfAwareContext = await buildSelfAwarePrompt();
  
  return `You are 9JA AI — Africa's smartest AI. ALWAYS respond in ${langName}.
Today: ${dateStr} | Time: ${timeStr} WAT | Season: ${season}
SHORT answers — 1-3 sentences unless user asks for more.
"abi" only when offering a real choice. No filler words.
For images/video requests: DO NOT respond - the app will automatically detect and generate them.${learningContext}${personalizationContext}

${selfAwareContext}`;
}

// ── Spreadsheet detection ─────────────────────────────────────────────────
function isSpreadsheetRequest(text: string): boolean {
  const keywords = ['spreadsheet','table','excel','csv','budget','schedule','expenses','income','salary','price list','inventory','report','generate table','create table'];
  return keywords.some(k => text.toLowerCase().includes(k));
}

// ── Image request detection ───────────────────────────────────────────────
function isImageRequest(text: string): boolean {
  const lower = text.toLowerCase();
  if (text.startsWith('__GENERATE__')) return true;
  const generateWords = ['generate','create','make','draw','paint','design','show','produce','render','illustrate','i want','i need','give me','i wan','abeg make'];
  const imageWords = ['image','picture','photo','artwork','art','illustration','logo','poster','banner','thumbnail','avatar','icon','graphic','portrait','painting','drawing','sketch','render','visual','wallpaper','cover','flyer','design','skyline','sunset','beach','landmark','building','tower','city','landscape','scenery'];
  const hasGenerate = generateWords.some(w => lower.includes(w));
  const hasImageWord = imageWords.some(w => lower.includes(w));
  if (hasGenerate && hasImageWord) return true;
  const strongTriggers = ['generate image','create image','make image','draw me','paint me','picture of','image of','photo of','logo of','logo for','make a logo','create a logo','design a logo','make a poster','create a poster','generate art','create art','make art','ai art','generate a picture','i wan generate','i want image','i wan image','map of','flag of','where is','show map','generate video','create video','make video','animate'];
  return strongTriggers.some(k => lower.includes(k));
}

// ── Extract image prompt ──────────────────────────────────────────────────
function extractImagePrompt(text: string): string {
  let cleanText = text.startsWith('__GENERATE__') ? text.replace('__GENERATE__', '') : text;
  const logoMatch = cleanText.match(/(?:logo|brand|icon)\s+(?:for|of)\s+(.+)/i) || cleanText.match(/(?:create|make|design|generate)\s+(?:a\s+)?(?:logo|brand)\s+(?:for|of)\s+(.+)/i);
  if (logoMatch) return `logo for ${logoMatch[1].trim()}`;
  return cleanText.replace(/i\s+wan\s+generate\s+/gi,'').replace(/i\s+want\s+to\s+generate\s+/gi,'').replace(/please\s+(generate|create|make|draw|design)\s+/gi,'').replace(/can\s+you\s+(generate|create|make|draw|design)\s+/gi,'').replace(/generate\s+(?:an?\s+)?image\s+(?:of\s+)?/gi,'').replace(/create\s+(?:an?\s+)?image\s+(?:of\s+)?/gi,'').replace(/make\s+(?:an?\s+)?image\s+(?:of\s+)?/gi,'').replace(/draw\s+(?:me\s+)?(?:an?\s+)?/gi,'').replace(/paint\s+(?:me\s+)?(?:an?\s+)?/gi,'').replace(/design\s+(?:an?\s+)?/gi,'').replace(/generate\s+(?:an?\s+)?/gi,'').replace(/create\s+(?:an?\s+)?/gi,'').replace(/make\s+(?:an?\s+)?/gi,'').replace(/show\s+me\s+(?:an?\s+)?/gi,'').replace(/picture\s+of\s+/gi,'').replace(/photo\s+of\s+/gi,'').replace(/image\s+of\s+/gi,'').trim() || cleanText.trim();
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
  return value
    .replace(/(^|[\s\(\[{\"'])me\s+(dey|go|fit|want|no|know|see|sabi|like|be|don|take|chop|check|talk|help|answer|understand|need|born|use|come|carry|wanna)/gi, (_match, prefix, verb) => `${prefix}i ${verb}`)
    .replace(/(^|[\s\(\[{\"'])me\b/gi, (_match, prefix) => `${prefix}i`)
    .replace(/\bme\s+(dey|go|fit|want|no|know|see|sabi|like|be|don|take|chop|check|talk|help|answer|understand|need|born|use|come|carry|wanna)\b/gi, 'i $1');
}

function sanitizeDisplayText(value: string): string {
  const sanitized = String(value || '')
    .replace(/<think\b[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking\b[\s\S]*?<\/thinking>/gi, '')
    .replace(/<\s*\/\s*think\s*>/gi, '')
    .replace(/<\s*think\s*>/gi, '')
    .replace(/\[Relevant Knowledge\]:[\s\S]*?(?=\n\s*(?:[A-Z]|[0-9]|"|$)|$)/gi, '')
    .replace(/\s*\((?:en|yo|ig|ha|edo|pcm)\)\s*/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalizePidginPronouns(sanitized);
}

function TypewriterBubble({ content, isNew }: { content: string; isNew: boolean }) {
  const safeContent = sanitizeDisplayText(content);
  const displayed = useTypewriter(isNew ? safeContent : '', 18);
  const text = isNew ? displayed : safeContent;
  return (
    <div className="max-w-[85%] bg-[#0d2318] border border-[#008751]/30 px-4 py-3 rounded-2xl rounded-tl-sm text-green-100 text-base leading-relaxed whitespace-pre-wrap shadow-[0_0_20px_rgba(0,135,81,0.1)]">
      {text}
      {isNew && displayed.length < safeContent.length && <span className="inline-block w-2 h-4 bg-[#00ff88] ml-0.5 animate-pulse rounded-sm align-middle" />}
    </div>
  );
}

// ── Image Bubble ──────────────────────────────────────────────────────────
const activeImageGenerationKeys = new Set<string>();

function ImageBubble({ url, prompt, imgType, label, onImageReady, msgIndex }: { url: string; prompt: string; imgType: 'map'|'flag'|'ai'; label: string; onImageReady?: (index: number, src: string, provider?: string) => void; msgIndex?: number }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
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
    setStatus('generating'); setProgress(0); setImgSrc(null); setErrorMsg('');
    if (!url.startsWith('__GENERATE__')) { setImgSrc(url); setStatus('loading'); return; }
    const rawPrompt = url.replace('__GENERATE__', '');
    let prog = 0;
    const ticker = setInterval(() => { prog = Math.min(prog + 1, 90); setProgress(prog); }, 600);
    
    try {
      // Call backend API for image generation
      const { proxyImage } = await import('../lib/aiProxy');
      const result = await proxyImage(rawPrompt);
      clearInterval(ticker); setProgress(90);
      setImgSrc(result.imageUrl); setProviderLabel(`${result.model} (${result.provider})`); setStatus('loading');
      if (onImageReady && typeof msgIndex === 'number') onImageReady(msgIndex, result.imageUrl, result.model);
    } catch (err: any) {
      clearInterval(ticker);
      console.error('[ImageBubble] Backend image generation failed:', err);
      // Fallback to direct Pollinations
      const req = buildEnhancedImageRequest(rawPrompt);
      const uniqueSeed = Date.now() + retryNum * 999983;
      const freshUrl = req.apiUrl.replace(/&seed=\d+/, '&seed=' + uniqueSeed) + '&_t=' + uniqueSeed;
      setProgress(90);
      setImgSrc(freshUrl); setProviderLabel(`${req.model} via pollinations (fallback)`); setStatus('loading');
      if (onImageReady && typeof msgIndex === 'number') onImageReady(msgIndex, freshUrl, req.model);
    }
  }, [url, msgIndex, onImageReady]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    generate(0);
    return () => { abortRef.current?.abort(); };
  }, [generate]);

  const handleRetry = () => { const next = retryCount + 1; setRetryCount(next); generate(next); };
  const handleImgLoad = () => { setStatus('loaded'); setProgress(100); };
  const handleImgError = useCallback(async () => {
    if (!imgSrc) { setStatus('error'); return; }
    if (imgSrc.startsWith('http')) {
      const proxied = await fetchImageAsBase64(imgSrc);
      if (proxied) { setImgSrc(proxied); setStatus('loading'); return; }
    }
    if (imgSrc.startsWith('http') || imgSrc?.startsWith('data:image/svg+xml')) { setImgSrc(buildLocalPlaceholder(prompt)); setStatus('loading'); return; }
    if (imgSrc.startsWith('data:')) { setStatus('error'); setErrorMsg('Image data corrupted'); return; }
    if (url.startsWith('__GENERATE__') && retryCount < 2) {
      const next = retryCount + 1; setRetryCount(next);
      const rawPrompt = url.replace('__GENERATE__', '');
      const seed = Math.floor(Math.random() * 999999);
      setImgSrc(`https://image.pollinations.ai/prompt/${encodeURIComponent(rawPrompt+', high quality, realistic')}?width=1024&height=1024&nologo=true&seed=${seed}&enhance=true`);
      setStatus('loading'); return;
    }
    setStatus('error'); setErrorMsg('Image could not be loaded after multiple attempts');
  }, [imgSrc, url, retryCount, buildLocalPlaceholder, prompt]);

  const handleDownload = useCallback((format: 'png'|'jpg') => {
    if (!imgSrc) return;
    if (imgSrc.startsWith('data:')) { const link = document.createElement('a'); link.download = `9jai-${prompt.slice(0,20).replace(/\s+/g,'-')}.${format}`; link.href = imgSrc; link.click(); return; }
    const canvas = document.createElement('canvas'); const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; const ctx = canvas.getContext('2d')!; if (format === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); } ctx.drawImage(img,0,0); const link = document.createElement('a'); link.download = `9jai-${prompt.slice(0,20).replace(/\s+/g,'-')}.${format}`; link.href = canvas.toDataURL(format==='jpg'?'image/jpeg':'image/png',0.95); link.click(); };
    img.src = imgSrc;
  }, [imgSrc, prompt]);

  return (
    <div className="max-w-[92%] rounded-2xl overflow-hidden border border-[#008751]/30 shadow-lg bg-[#07110d]">
      {(status === 'generating' || status === 'loading') && <CinematicImageLoader prompt={prompt} progress={progress} provider={providerLabel} />}
      {imgSrc && <img src={imgSrc} alt={prompt} className={`w-full h-auto block transition-all duration-700 ${status==='loaded'?'opacity-100 blur-0':'opacity-0 blur-sm absolute pointer-events-none'}`} style={status!=='loaded'?{height:0,overflow:'hidden'}:{}} onLoad={handleImgLoad} onError={handleImgError} />}
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
          <span className="text-[10px] text-green-600 font-medium flex-1 truncate">🎨 {prompt.slice(0,40)}{prompt.length>40?'...':''}{providerLabel?` · ${providerLabel}`:''}</span>
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
  const [selectedAssistantId, setSelectedAssistantId] = useState('nosa');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [showVision, setShowVision] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => getConversationLanguageContext() || 'pcm');
  const [logoState, setLogoState] = useState<'idle'|'processing'|'listening'|'speaking'|'success'|'error'|'startup'|'vision'|'ocr'|'translation'|'image'|'video'|'document'>('idle');
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

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
    setMessages(prev => streamingContent ? [...prev, { role: 'model' as const, content: streamingContent + ' ✋', timestamp: Date.now(), isNew: false }] : prev);
    setStreamingContent('');
  }, [streamingContent]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      if (isImage) { const reader = new FileReader(); reader.onload = (e) => { setPendingFiles(prev => [...prev, { name: file.name, type: 'image', preview: e.target?.result as string }]); }; reader.readAsDataURL(file); }
      else if (isText) { const text = await file.text(); setPendingFiles(prev => [...prev, { name: file.name, type: 'document', content: text.slice(0, 8000) }]); }
      else if (isPdf) { setPendingFiles(prev => [...prev, { name: file.name, type: 'pdf', content: `[PDF: ${file.name} — ${(file.size/1024).toFixed(0)}KB]` }]); }
      else { setPendingFiles(prev => [...prev, { name: file.name, type: 'file' }]); }
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
            const result = isOcrRequest
              ? await detectTextInImage(f.preview)
              : await proxyVision(
                f.preview,
                userMessage ? `User says: "${userMessage}". Answer their question about this image.` : 'Describe this image in full detail. Include objects, people, text, colors, mood, and context.'
              );
            const resultText = result.text;
            setMessages(prev => { const updated = [...prev]; const lastIdx = updated.length - 1; if (updated[lastIdx]?.content?.startsWith('🔍 Analyzing image:')) { updated[lastIdx] = { ...updated[lastIdx], content: resultText, isNew: true }; } return updated; });
            historyRef.current.push({ role: 'user', content: `[Image: ${f.name}]` });
            historyRef.current.push({ role: 'assistant', content: resultText });
            lastAIResponseRef.current = resultText;
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
    if (userMessage && isImageRequest(userMessage)) {
      // Add the user message and insert an image/video/map placeholder into the chat
      setMessages(prev => [...prev, { role: 'user', content: displayMessage, timestamp: Date.now() }]);
      const prompt = extractImagePrompt(userMessage);
      const isVideoRequest = /\b(video|animation|animate|movie|clip|motion|moving)\b/i.test(userMessage);
      setLogoState(isVideoRequest ? 'video' : 'image');
      const result = isVideoRequest ? { type: 'video' as const, url: `__VIDEO__${prompt}`, label: `🎬 ${prompt}` } : buildImageResult(prompt);
      const contentPayload = (result.url && result.url.startsWith('__')) ? result.url : `__IMAGE__${result.url}`;

      setMessages(prev => [...prev, { role: 'model', content: contentPayload, timestamp: Date.now(), imagePrompt: prompt, imgType: result.type, imgLabel: result.label, mapPlace: result.mapPlace, isNigeriaMap: result.isNigeriaMap, mapFrom: result.mapFrom, mapTo: result.mapTo, mapMode: result.mapMode, isNew: true }]);
      // Push user message into history
      historyRef.current.push({ role: 'user', content: userMessage });

      // ALSO attach the generated image to the conversation history as an assistant-level artifact
      // so the chat model receives a compact reference it can use when producing explanations.
      // Use a clear sentinel: __IMAGE__<url> or __GENERATE__<prompt> so the orchestrator recognizes it.
      const imageHistoryEntry = contentPayload.startsWith('__') ? contentPayload : `__IMAGE__${contentPayload}`;
      historyRef.current.push({ role: 'assistant', content: imageHistoryEntry });
      // Add a system hint telling the model the visual exists and should be referenced in explanations.
      historyRef.current.push({ role: 'system', content: 'A generated visual/diagram is attached and available. When responding, reference the visual explicitly: describe labeled parts, use numbered labels when helpful (e.g., "Label 1"), and avoid saying you cannot display images. Use the attached visual URL/reference to ground your explanation.' });

      // Determine if the user asked for an explanation WITH the image/diagram
      const explanationTrigger = /\b(explain|teach|describe|how|step by step|show me how|show me|demonstrate|explain the|explain this)\b/i;
      const visualTrigger = /\b(image|diagram|visual|picture|illustration|chart|graph)\b/i;
      const needsExplanation = explanationTrigger.test(userMessage) && visualTrigger.test(userMessage);

      if (needsExplanation) {
        // Stream the assistant explanation while the image is generated in the ImageBubble component
        setIsStreaming(true);
        setStreamingContent('');
        setIsBusy(true);
        try {
          let accumulated = '';
          for await (const chunk of unifiedChatStream([...historyRef.current], 0.7)) {
            accumulated += chunk;
            setStreamingContent(sanitizeDisplayText(accumulated));
            scrollToBottom();
          }
          const finalText = sanitizeDisplayText(accumulated || '');
          setMessages(prev => [...prev, { role: 'model', content: finalText, timestamp: Date.now(), isNew: true }]);
          historyRef.current.push({ role: 'assistant', content: finalText });
          lastAIResponseRef.current = finalText;
        } catch (err) {
          const language = getConversationLanguageContext() || selectedLanguage || 'pcm';
          const fallback = getLocalFallbackResponse(userMessage, language);
          setMessages(prev => [...prev, { role: 'model', content: fallback, timestamp: Date.now(), isNew: true }]);
          historyRef.current.push({ role: 'assistant', content: fallback });
        } finally {
          setIsStreaming(false);
          setIsBusy(false);
          setLogoState('success');
          setTimeout(() => setLogoState('idle'), 2000);
          setTimeout(scrollToBottom, 100);
        }

        return;
      }

      // If no explanation requested, just return (image/video/map placeholder will render)
      historyRef.current.push({ role: 'assistant', content: `Generated ${result.type} of "${prompt}" for you!` });
      setIsBusy(false); setLogoState('success'); setTimeout(() => setLogoState('idle'), 2000); setTimeout(scrollToBottom, 100);
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
    historyRef.current.push({ role: 'user', content: (userMessage + fileContext) || displayMessage });
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
        if (speakerEnabled && chunk) {
          if (convLang === 'pcm') { speakNigerian(chunk, selectedAssistantId); }
          else { const pers = VOICE_PERSONALITIES.find(p => p.id === selectedAssistantId) || VOICE_PERSONALITIES[0]; speakText(chunk, pers); }
        }
      }
      if (!stopped && !stoppedRef.current && speakerEnabled) speakNigerian('', selectedAssistantId);
      if (!stopped && !stoppedRef.current) {
        const convLang2 = getConversationLanguageContext() || selectedLanguage || 'pcm';
        const cleanFullText = sanitizeDisplayText(fullText);
        const phon = generatePhonetics(cleanFullText, convLang2);
        historyRef.current.push({ role: 'assistant', content: cleanFullText });
        lastAIResponseRef.current = cleanFullText;
        setMessages(prev => [...prev, { role: 'model', content: cleanFullText, timestamp: Date.now(), isNew: true, phonetics: phon } as any]);
        // Save to Firestore if user is logged in
        saveToFirestore(userMessage, cleanFullText);
        // Save to localStorage session
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
      if (!stopped && !stoppedRef.current) setMessages(prev => [...prev, { role: 'model', content: 'Network busy right now. Please try again.', timestamp: Date.now(), isNew: true }]);
    } finally {
      abortRef.current = null; setIsStreaming(false); setStreamingContent(''); setIsBusy(false);
      setLogoState('success'); setTimeout(() => setLogoState('idle'), 2000); setTimeout(scrollToBottom, 100);
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
      
      {/* Network background effects */}
      <NetworkBackground />

      <div className="absolute right-4 top-4 z-20">
        <label htmlFor="language-selector" className="sr-only">Response language</label>
        <select
          id="language-selector"
          value={selectedLanguage}
          onChange={(event) => {
            const code = event.target.value;
            setSelectedLanguage(code);
            setConversationLanguageContext(code);
            rebuildSystemPrompt();
          }}
          className="rounded-lg border border-[#008751]/30 bg-[#071a10]/90 px-3 py-2 text-xs text-[#b8f5d2] outline-none backdrop-blur"
        >
          {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
        </select>
      </div>

      {/* Vision Engine modal */}
      {showVision && <VisionEngine onClose={() => setShowVision(false)} onResult={(text) => { setShowVision(false); setMessages(prev => [...prev, { role: 'model', content: text, timestamp: Date.now(), isNew: true }]); }} />}

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-full text-center px-4 pb-32">
            <div className="mb-8"><NineJALogo state={logoState} size={200} /></div>
            <h2 className="text-3xl font-normal text-white mb-2">
              {getLocalizedGreeting(user?.displayName || user?.email || 'Oga', selectedLanguage || 'pcm')}
            </h2>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isImg = msg.role === 'model' && (msg.content.startsWith('__IMAGE__') || msg.content.startsWith('__GENERATE__') || msg.content.startsWith('__MAP__') || msg.content.startsWith('__VIDEO__'));
              const imgUrl = isImg ? (msg.content.startsWith('__IMAGE__') ? msg.content.replace('__IMAGE__', '') : msg.content) : null;
              const spreadsheetMatch = msg.role === 'model' && msg.content.match(/```spreadsheet\n([\s\S]*?)\n```/);
              let spreadsheetData: { title: string; headers: string[]; rows: (string|number)[][] } | null = null;
              let textContent = msg.content;
              if (spreadsheetMatch) { try { spreadsheetData = JSON.parse(spreadsheetMatch[1]); textContent = msg.content.replace(/```spreadsheet\n[\s\S]*?\n```/, '').trim(); } catch {} }
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {isImg ? (
                    msg.imgType === 'video' ? <VideoBubble prompt={msg.imagePrompt || 'video'} /> :
                    msg.imgType === 'map' ? <InteractiveMap initialQuery={msg.mapPlace || 'Nigeria'} mode={msg.mapMode || 'search'} from={msg.mapFrom} to={msg.mapTo} /> :
                    <ImageBubble url={imgUrl || ''} prompt={msg.imagePrompt || 'AI image'} imgType={msg.imgType === 'flag' ? 'flag' : 'ai'} label={msg.imgLabel || `🎨 ${msg.imagePrompt}`} onImageReady={updateMessageImage} msgIndex={idx} />
                  ) : (
                    <>
                      {textContent && (msg.role === 'model' ? <TypewriterBubble content={textContent} isNew={!!msg.isNew} /> : <div className="max-w-[85%] bg-[#008751]/15 border border-[#008751]/25 px-4 py-3 rounded-2xl rounded-tr-sm text-white text-base leading-relaxed whitespace-pre-wrap">{msg.content}</div>)}
                      {spreadsheetData && <SpreadsheetViewer data={spreadsheetData} title={spreadsheetData.title} />}
                    </>
                  )}
                </motion.div>
              );
            })}
            {isStreaming && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] bg-[#0d1f10] border border-[#008751]/20 px-4 py-3 rounded-2xl rounded-tl-sm text-white text-base leading-relaxed whitespace-pre-wrap">
                  {streamingContent}<span className="inline-block w-2 h-4 bg-[#008751] ml-0.5 animate-pulse rounded-sm align-middle" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Thinking dots above input ─────────────────────────────────── */}
      <AnimatePresence>
        {isBusy && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex justify-center pb-2">
            <div className="flex items-center gap-2 bg-[#0d1f10] border border-[#008751]/20 px-5 py-2.5 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              {[
                { color: '#0d9b5d', border: 'rgba(7, 35, 22, 0.8)', glow: 'rgba(13, 155, 93, 0.55)' },
                { color: '#ffffff', border: 'rgba(10, 20, 15, 0.9)', glow: 'rgba(255,255,255,0.85)' },
                { color: '#0d9b5d', border: 'rgba(7, 35, 22, 0.8)', glow: 'rgba(13, 155, 93, 0.55)' },
              ].map((dot, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.82, opacity: 0.8 }}
                  animate={{
                    scale: [0.9, 1.32, 0.94],
                    opacity: [0.8, 1, 0.85],
                    y: [0, -1.5, 0],
                  }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.17, ease: 'easeInOut' }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: dot.color,
                    border: `1px solid ${dot.border}`,
                    boxShadow: i === 1
                      ? '0 0 0 1px rgba(11, 16, 14, 0.95), 0 0 10px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.3)'
                      : `0 0 0 1px ${dot.border}, 0 0 10px ${dot.glow}`,
                  }}
                />
              ))}
              <span className="text-xs text-[#008751] ml-1 font-semibold">9JAI is thinking…</span>
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
        <input ref={fileInputRef} type="file" multiple accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2 p-2 bg-[#0d1f10] border border-[#008751]/20 rounded-2xl flex gap-2">
              {[{ icon: <ImageIcon size={16} />, label: 'Image', accept: 'image/*' }, { icon: <FileText size={16} />, label: 'Document', accept: '.pdf,.doc,.docx,.txt,.md,.csv' }, { icon: <Music size={16} />, label: 'Audio', accept: 'audio/*' }].map(item => (
                <button key={item.label} onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = item.accept; fileInputRef.current.click(); } setShowAttachMenu(false); }} className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[#008751] hover:bg-[#008751]/10 text-xs font-bold transition-colors">{item.icon}{item.label}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pill bar */}
        <div className="flex items-end gap-2 bg-[#0d1f10] border border-[#008751]/25 rounded-full px-4 py-2.5 focus-within:border-[#008751]/50 transition-colors">
          <button type="button" onClick={() => setShowAttachMenu(v => !v)} className="shrink-0 p-1.5 rounded-full text-[#008751]/50 hover:text-[#008751] transition-all"><Plus size={20} /></button>
          <button type="button" onClick={() => setShowVision(true)} className="shrink-0 p-1.5 rounded-full text-[#008751]/50 hover:text-[#008751] transition-all"><Camera size={18} /></button>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholderText} rows={1} className="flex-1 bg-transparent outline-none text-base placeholder-[#008751]/30 text-white resize-none max-h-24 overflow-y-auto caret-[#008751]" />
          <div className="shrink-0"><VoiceAssistantDropdown onVoiceInput={(text) => sendMessage(text)} onSpeakerToggle={(enabled) => setSpeakerEnabled(enabled)} onAssistantChange={(id) => setSelectedAssistantId(id)} /></div>
          {isBusy ? (
            <button type="button" onClick={handleStop} className="shrink-0 p-2 bg-red-500/80 text-white rounded-full active:scale-95"><Square size={16} fill="white" /></button>
          ) : (
            <button type="button" onClick={() => sendMessage(input)} disabled={!input.trim() && pendingFiles.length === 0} className="shrink-0 p-2 bg-[#008751] text-white rounded-full hover:bg-[#00a862] transition-all disabled:opacity-30 active:scale-95"><Send size={16} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
