import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Volume2, VolumeX, User, Mic,
  Paperclip, X, Image, FileAudio, ChevronDown,
  StopCircle, Copy, Check, Code2, Square, Radio,
  Book, Scroll, Database, Globe, Loader2,
} from 'lucide-react';
import { RotatingLogoMedium } from './RotatingLogo';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User as FirebaseUser } from 'firebase/auth';
import { unifiedChatStream, transcribeWithWhisper, ChatAttachment } from '../lib/ai';
import { ChatMessage } from '../types';
import { recordAudioBlob, customAudioCache } from '../lib/voice';
import { getLanguageVocabulary } from '../lib/languageVocabularies';
import { saveChatSession, getActiveSessionId, createNewSession, getUserSessions } from '../lib/sessionManager';
import { buildEnhancedSystemPrompt } from '../lib/enhancedSystemPrompt';
import { generateImage, saveImageToHistory } from '../lib/imageService';
import { analyzeForCreativeRequest, buildCreativePrompt, formatCreativeContent, hasCreativeKeywords, buildCreativeSystemPrompt } from '../lib/creativeIntegration';
import { generateCreativeContent } from '../lib/creativeContentGenerator';
import ImageGenerator from './ImageGenerator';
import GeoMapViewer from './GeoMapViewer';
import SvgImageGenerator from './SvgImageGenerator';
import { generateImageWithFallback } from '../lib/imageService';

interface LanguageAssistantProps {
  user?: FirebaseUser | null;
  isAdmin: boolean;
  languageName: string;
  languageId: string;
  nativeName: string;
  onNavigate: (section: 'overview' | 'dictionary' | 'practice' | 'repository') => void;
}

// ── Build a language-specific system prompt ───────────────────────────────
function buildSystemPrompt(languageName: string, nativeName: string, vocab: ReturnType<typeof getLanguageVocabulary>): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' });
  const timeStr = now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });
  const month = now.getMonth();
  const season = (month >= 3 && month <= 9) ? 'Rainy season' : 'Dry/Harmattan season';

  // Use enhanced system prompt as base
  const enhancedPrompt = buildEnhancedSystemPrompt(languageName, nativeName);

  // Inject date/time awareness
  const dateBlock = `\n\n## CURRENT DATE & TIME — YOU KNOW THIS
- Today: ${dateStr}
- Time: ${timeStr} (WAT, UTC+1)
- Season in Nigeria: ${season}
Never say you don't know the date or time.`;

  // Add vocabulary reference if available
  const vocabLines: string[] = [];
  if (vocab) {
    for (const cat of vocab.categories) {
      for (const item of cat.items) {
        vocabLines.push(`${item.translation} = ${item.term}`);
      }
    }
  }
  const vocabBlock = vocabLines.length > 0
    ? `\n\n## ${languageName} Vocabulary Reference\n${vocabLines.join('\n')}`
    : '';

  return enhancedPrompt + dateBlock + vocabBlock;
}

// ── Suggestion chips per language ─────────────────────────────────────────
function getSuggestions(languageName: string) {
  return [
    { label: `Greet in ${languageName}`, prompt: `How do I say hello and good morning in ${languageName}?` },
    { label: 'Common phrases', prompt: `Teach me 5 essential everyday phrases in ${languageName} with pronunciation.` },
    { label: 'Count 1–10', prompt: `How do I count from 1 to 10 in ${languageName}?` },
    { label: 'Family words', prompt: `What are the words for mother, father, brother, sister in ${languageName}?` },
    { label: 'Culture & history', prompt: `Tell me about the culture and history of the ${languageName} people.` },
    { label: 'Translate to English', prompt: `I will say a ${languageName} word or phrase — please translate it to English for me.` },
    { label: 'Pronunciation guide', prompt: `How is ${languageName} pronounced? Give me the key sounds and rules.` },
    { label: 'Love & greetings', prompt: `How do I say "I love you", "thank you", and "welcome" in ${languageName}?` },
  ];
}

// ── Code block ────────────────────────────────────────────────────────────
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') ?? 'code';
  const copy = () => { navigator.clipboard.writeText(children).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#0A0A0A]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2"><Code2 size={12} className="text-[#5A5A40]" /><span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A]">{lang}</span></div>
        <button onClick={copy} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A] hover:text-white transition-colors">
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}{copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[#C9D1D9] font-mono"><code>{children}</code></pre>
    </div>
  );
}

// ── Typewriter effect hook ───────────────────────────────────────────────
function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      code({ node, className, children, ...props }: any) {
        const isBlock = !props.inline;
        const text = String(children).replace(/\n$/, '');
        if (isBlock) return <CodeBlock className={className}>{text}</CodeBlock>;
        return <code className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm sm:text-base font-mono font-bold" {...props}>{children}</code>;
      },
      p: ({ children }) => <p className="mb-3 sm:mb-4 last:mb-0 leading-relaxed text-base sm:text-lg font-medium">{children}</p>,
      ul: ({ children }) => <ul className="list-disc list-inside mb-3 sm:mb-4 space-y-2 text-base sm:text-lg">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside mb-3 sm:mb-4 space-y-2 text-base sm:text-lg">{children}</ol>,
      li: ({ children }) => <li className="text-base sm:text-lg font-medium">{children}</li>,
      h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 mt-4 sm:mt-5">{children}</h1>,
      h2: ({ children }) => <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 mt-3 sm:mt-4">{children}</h2>,
      h3: ({ children }) => <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 mt-2 sm:mt-3 uppercase tracking-wide">{children}</h3>,
      strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
      blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-400 pl-4 my-3 sm:my-4 text-gray-700 italic text-base sm:text-lg">{children}</blockquote>,
      table: ({ children }) => <div className="overflow-x-auto my-3 sm:my-4"><table className="w-full text-sm sm:text-base border-collapse">{children}</table></div>,
      th: ({ children }) => <th className="border border-gray-300 px-3 py-2 bg-gray-100 text-left font-bold text-gray-900 uppercase tracking-wide text-sm sm:text-base">{children}</th>,
      td: ({ children }) => <td className="border border-gray-300 px-3 py-2 text-gray-800 text-sm sm:text-base">{children}</td>,
      a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#008751] hover:text-[#00A862] underline underline-offset-2 transition-colors font-semibold">{children}</a>,
    }}>{content}</ReactMarkdown>
  );
}

function TypewriterMessage({ content, isModel }: { content: string; isModel: boolean }) {
  const displayedText = useTypewriter(content, 15);
  
  if (isModel) {
    return (
      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-white text-gray-900 rounded-xl sm:rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm text-lg sm:text-lg md:text-xl w-full font-medium leading-relaxed">
        <MessageContent content={displayedText} />
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-[#008751] text-white rounded-xl sm:rounded-2xl rounded-tr-sm text-lg sm:text-lg md:text-xl whitespace-pre-wrap max-w-full font-semibold leading-relaxed">
      {displayedText}
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  const displayedText = useTypewriter(content, 15);
  
  return (
    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-white text-gray-900 rounded-xl sm:rounded-2xl rounded-tl-sm border border-gray-200 text-lg sm:text-lg md:text-xl font-medium leading-relaxed">
      <MessageContent content={displayedText} />
      <span className="inline-block w-2 h-5 bg-[#008751] ml-0.5 animate-pulse rounded-sm align-middle" />
    </div>
  );
}

// ── Image bubble with loading spinner ────────────────────────────────────
function ImageBubble({ url, prompt }: { url: string; prompt: string }) {
  const [resolvedUrl, setResolvedUrl] = useState<string>(url);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (!url.startsWith('__GENERATE__')) {
      setResolvedUrl(url);
      return;
    }
    const rawPrompt = url.replace('__GENERATE__', '');
    console.log('[LanguageAssistant] Generating AI image for prompt:', rawPrompt);
    generateImageWithFallback(rawPrompt)
      .then(resolved => {
        console.log('[LanguageAssistant] Image generated URL:', resolved);
        setResolvedUrl(resolved);
      })
      .catch((err) => {
        console.error('[LanguageAssistant] Image generation failed:', err);
        setStatus('error');
      });
  }, [url]);
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 max-w-xs sm:max-w-sm">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-8">
          <Loader2 size={32} className="text-[#008751] animate-spin" />
          <p className="text-sm font-semibold text-gray-600 text-center">Generating "{prompt}"...</p>
          <div className="flex gap-1">
            {[0, 0.2, 0.4].map((d, i) => (
              <div key={i} className="w-2 h-2 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
            ))}
          </div>
        </div>
      )}
      <img
        src={resolvedUrl}
        alt={prompt}
        className={`w-full h-auto block transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0 h-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      {status === 'error' && (
        <p className="px-4 py-3 text-sm text-red-500 font-semibold">Image no load. Try again.</p>
      )}
    </div>
  );
}

export default function LanguageAssistant({ user, isAdmin, languageName, languageId, nativeName, onNavigate }: LanguageAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imageGeneratorPrompt, setImageGeneratorPrompt] = useState('');

  const vocab = getLanguageVocabulary(languageId);
  const systemPrompt = buildSystemPrompt(languageName, nativeName, vocab);
  const suggestions = getSuggestions(languageName);

  // ── Image generation detection ─────────────────────────────────────────
  const detectImageRequest = (text: string): boolean => {
    const imageKeywords = [
      'generate image', 'create image', 'draw', 'paint', 'create a picture',
      'make an image', 'generate a picture', 'create a photo', 'generate photo',
      'draw me', 'paint me', 'show me a picture', 'create artwork', 'generate art',
      'make a drawing', 'create a visual', 'generate visual', 'illustrate',
      'create illustration', 'generate illustration', 'make artwork', 'design',
      'create design', 'generate design', 'visualize', 'create visualization',
      'generate visualization', 'image of', 'picture of', 'photo of',
      'artwork of', 'illustration of', 'design of', 'visual of',
      'show image', 'show picture', 'show photo', 'show artwork',
      'generate image of', 'create image of', 'draw image of', 'paint image of',
    ];
    
    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Chat history — reset when language changes
  const historyRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([
    { role: 'system', content: systemPrompt },
  ]);

  // Load session on mount or when language changes
  useEffect(() => {
    const loadSession = async () => {
      try {
        const userId = user?.uid || 'anonymous';
        const activeSessionId = getActiveSessionId(userId);
        
        if (activeSessionId) {
          // Load existing session
          const sessions = getUserSessions(userId);
          const session = sessions.find(s => s.id === activeSessionId && s.languageId === languageId);
          
          if (session && session.messages.length > 0) {
            // Restore messages from session
            setMessages(session.messages);
            setSessionId(session.id);
            
            // Rebuild history from messages
            const newHistory = [{ role: 'system' as const, content: systemPrompt }];
            session.messages.forEach(msg => {
              newHistory.push({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: msg.content,
              });
            });
            historyRef.current = newHistory;
            return;
          }
        }
        
        // Create new session if none exists
        const newSession = createNewSession(userId, languageId, languageName);
        setSessionId(newSession.id);
        setMessages([]);
        historyRef.current = [{ role: 'system', content: systemPrompt }];
      } catch (error) {
        console.error('Error loading session:', error);
        // Fallback: create new session
        setMessages([]);
        historyRef.current = [{ role: 'system', content: systemPrompt }];
      }
    };

    loadSession();
  }, [languageId, user?.uid, systemPrompt]);

  // Save session whenever messages change
  useEffect(() => {
    if (sessionId && user?.uid && messages.length > 0) {
      try {
        saveChatSession(user.uid, {
          id: sessionId,
          languageId,
          languageName,
          messages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          title: `${languageName} Chat - ${new Date().toLocaleDateString()}`,
        });
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  }, [messages, sessionId, user?.uid, languageId, languageName]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const micRecorderRef = useRef<{ stop: () => void } | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Visual Viewport: resize container when keyboard opens so input stays visible ──
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${vv.height}px`;
      }
      // Always scroll to bottom so latest message is visible
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent, isLoading]);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  // REMOVED: focus interval that was stealing cursor from textarea

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setIsSpeaking(false); setSpeakingIdx(null);
  }, []);

  const browserTTS = useCallback((text: string, idx?: number) => {
    const clean = text.replace(/```[\s\S]*?```/g, 'code block').replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.includes('en-NG')) || voices.find(v => v.lang.includes('en-GB')) || voices.find(v => v.lang.includes('en-US'));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => { setIsSpeaking(false); setSpeakingIdx(null); };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingIdx(null); };
    setIsSpeaking(true);
    if (idx !== undefined) setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakMessage = useCallback((text: string, idx: number) => {
    window.speechSynthesis?.cancel();
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    browserTTS(text, idx);
  }, [browserTTS]);

  const sendMessage = useCallback(async (text: string, atts: ChatAttachment[] = []) => {
    if ((!text.trim() && atts.length === 0) || isLoading || isStreaming) return;
    
    // Check if this is a creative content request (lyrics, poetry, story, suno)
    if (hasCreativeKeywords(text)) {
      const creativeRequest = analyzeForCreativeRequest(text, languageId, languageName, languageId);
      
      if (creativeRequest.isCreative) {
        // Add user message to chat
        const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        
        // Add loading message
        const loadingMsg: ChatMessage = {
          role: 'model',
          content: `✨ Creating ${creativeRequest.type}...`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, loadingMsg]);
        
        // Focus input
        setTimeout(() => inputRef.current?.focus(), 50);
        
        try {
          setIsLoading(true);
          const creativePrompt = buildCreativePrompt(creativeRequest);
          
          let fullContent = '';
          for await (const chunk of generateCreativeContent(creativePrompt)) {
            fullContent += chunk;
          }
          
          // Format and add creative content to chat
          const formattedContent = formatCreativeContent(creativeRequest.type || 'lyrics', fullContent);
          
          // Remove loading message and add actual content
          setMessages(prev => {
            const updated = [...prev];
            updated.pop(); // Remove loading message
            return [...updated, { role: 'model', content: formattedContent, timestamp: Date.now() }];
          });
          
          // Add to history
          historyRef.current.push({ role: 'user', content: text });
          historyRef.current.push({ role: 'assistant', content: formattedContent });
          
          setIsLoading(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        } catch (err) {
          console.error('Creative content error:', err);
          setMessages(prev => {
            const updated = [...prev];
            updated.pop(); // Remove loading message
            return [...updated, { role: 'model', content: '❌ Error generating creative content. Please try again.', timestamp: Date.now() }];
          });
          setIsLoading(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
        return;
      }
    }
    
    // Check if this is an image generation request
    if (detectImageRequest(text)) {
      const imagePrompt = text
        .replace(/generate\s+image\s+of\s+/gi, '')
        .replace(/create\s+image\s+of\s+/gi, '')
        .replace(/draw\s+/gi, '')
        .replace(/paint\s+/gi, '')
        .replace(/generate\s+image\s+/gi, '')
        .replace(/create\s+image\s+/gi, '')
        .replace(/create\s+a\s+/gi, '')
        .replace(/generate\s+a\s+/gi, '')
        .replace(/show\s+me\s+/gi, '')
        .replace(/show\s+/gi, '')
        .trim();

      const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setAttachments([]);

      // Use smart image source based on request type
      const lower = imagePrompt.toLowerCase();
      let imageUrl: string;
      if (lower.includes('map')) {
        const place = imagePrompt.replace(/map\s+of\s+/gi, '').trim() || 'Nigeria';
        // Use __MAP__ prefix so the renderer knows to use GeoMapViewer
        imageUrl = `__MAP__${place}`;
      } else if (lower.includes('flag')) {
        const countryToCode: Record<string, string> = { nigeria: 'ng', ghana: 'gh', kenya: 'ke', 'south africa': 'za', cameroon: 'cm', senegal: 'sn', usa: 'us', uk: 'gb', france: 'fr', germany: 'de' };
        const country = imagePrompt.replace(/flag\s+of\s+/gi, '').trim().toLowerCase();
        const code = Object.keys(countryToCode).find(k => country.includes(k));
        imageUrl = `https://flagcdn.com/w640/${code ? countryToCode[code] : 'ng'}.png`;
      } else if (lower.includes('food') || lower.includes('jollof') || lower.includes('suya')) {
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt + ', Nigerian food photography, professional, appetizing, high resolution')}?width=768&height=512&nologo=true&enhance=true&seed=${Date.now()}`;
      } else {
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt + ', high quality, detailed, realistic, professional')}?width=768&height=512&nologo=true&enhance=true&seed=${Date.now()}`;
      }
      setMessages(prev => [
        ...prev,
        { role: 'model', content: `__IMAGE__${imageUrl}`, timestamp: Date.now(), imagePrompt: imagePrompt } as any,
      ]);
      historyRef.current.push({ role: 'user', content: text });
      historyRef.current.push({ role: 'assistant', content: `Generated image of "${imagePrompt}"` });
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setAttachments([]); setIsLoading(true); abortRef.current = false;
    
    // Focus input immediately after clearing
    setTimeout(() => inputRef.current?.focus(), 10);

    historyRef.current.push({ role: 'user', content: text });

    try {
      setIsLoading(false); setIsStreaming(true); setStreamingContent('');
      let fullText = '';
      for await (const chunk of unifiedChatStream(historyRef.current, 0.7)) {
        if (abortRef.current) break;
        fullText += chunk;
        setStreamingContent(fullText);
      }
      historyRef.current.push({ role: 'assistant', content: fullText });
      setIsStreaming(false); setStreamingContent('');
      setMessages(prev => [...prev, { role: 'model', content: fullText, timestamp: Date.now() }]);
      // Focus input after response completes
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      console.error('Chat error:', err);
      setIsStreaming(false); setStreamingContent('');
      setMessages(prev => [...prev, { role: 'model', content: 'Network busy. Please try again.', timestamp: Date.now() }]);
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally { setIsLoading(false); }
  }, [isLoading, isStreaming, languageId, languageName, user?.uid, systemPrompt, detectImageRequest, hasCreativeKeywords, analyzeForCreativeRequest, buildCreativePrompt, formatCreativeContent, generateCreativeContent]);

  const stopGeneration = () => {
    abortRef.current = true; setIsStreaming(false);
    if (streamingContent) {
      setMessages(prev => [...prev, { role: 'model', content: streamingContent, timestamp: Date.now() }]);
      setStreamingContent('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); sendMessage(input, attachments); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const startListening = useCallback(() => {
    if (isListening) { micRecorderRef.current?.stop(); setIsListening(false); return; }
    setIsListening(true);
    const recorder = recordAudioBlob((status) => { if (status === 'error') setIsListening(false); });
    micRecorderRef.current = recorder;
    recorder.promise.then(async ({ blob }) => {
      setIsListening(false);
      setInput('⏳ Transcribing...');
      const transcript = await transcribeWithWhisper(blob);
      if (voiceMode && transcript) { setInput(''); sendMessage(transcript, []); }
      else { setInput(transcript || ''); inputRef.current?.focus(); }
    }).catch(() => { setIsListening(false); setInput(''); });
  }, [isListening, voiceMode, sendMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const type: ChatAttachment['type'] = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'url';
        setAttachments(prev => [...prev, { type, name: file.name, data: base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const isEmpty = messages.length === 0 && !isStreaming && !isLoading;
  const modelIndexMap: number[] = [];
  let modelCount = 0;
  messages.forEach(msg => { modelIndexMap.push(msg.role === 'model' ? modelCount++ : -1); });

  // Section nav links — no Voice Lab
  const sections = [
    { id: 'overview' as const, label: 'Overview & History', icon: <Scroll size={13} /> },
    { id: 'dictionary' as const, label: 'Lexicon', icon: <Book size={13} /> },
    { id: 'repository' as const, label: 'Repository', icon: <Database size={13} /> },
  ];

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] bg-white text-[#1A1A1A] w-full flex flex-col overflow-hidden"
    >
      {/* Messages — fills all available space */}
      <div ref={scrollRef} onScroll={() => { const el = scrollRef.current; if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300); }} className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 space-y-2 w-full">
        {isEmpty && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[55vh] text-center px-3 sm:px-4">
            <div className="w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center mb-4 sm:mb-6">
              <RotatingLogoMedium />
            </div>
            <h2 className="text-2xl sm:text-2xl font-serif mb-2 text-[#008751]">Learn {languageName}</h2>
            <p className="text-[#008751]/60 text-sm sm:text-sm max-w-lg mb-6 sm:mb-8 leading-relaxed">
              Talk to me in <span className="text-[#008751] font-medium">{languageName}</span> or English. Ask me anything — greetings, phrases, culture, translation, or just have a conversation.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full max-w-3xl">
              {suggestions.map((s) => (
                <button key={s.label} onClick={() => sendMessage(s.prompt)}
                  className="p-3 sm:p-4 bg-[#008751]/5 border border-[#008751]/20 rounded-lg sm:rounded-2xl text-left hover:bg-[#008751]/10 hover:border-[#008751]/40 transition-all group">
                  <p className="text-xs sm:text-xs font-bold text-[#008751] uppercase tracking-widest mb-0.5 sm:mb-1">{s.label}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const modelIdx = modelIndexMap[idx];
            const isImg = msg.role === 'model' && msg.content.startsWith('__IMAGE__');
            const imgUrl = isImg ? msg.content.replace('__IMAGE__', '') : null;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'ml-auto flex-row-reverse max-w-xs sm:max-w-2xl' : 'mr-auto max-w-xs sm:max-w-3xl w-full'}`}>
                <div className={`w-6 sm:w-8 h-6 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 ${msg.role === 'user' ? 'bg-[#008751]' : 'bg-[#008751]/10 border border-[#008751]/20'}`}>
                  {msg.role === 'user'
                    ? (user?.photoURL ? <img src={user.photoURL} alt="" className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg sm:rounded-xl" referrerPolicy="no-referrer" /> : <User size={14} className="sm:w-4 sm:h-4 text-white" />)
                    : <img src="/logo.png" alt="BLACK AI" className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg object-cover" />}
                </div>
                <div className={`flex flex-col gap-1 min-w-0 flex-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {isImg ? (
                    imgUrl && imgUrl.startsWith('__MAP__') ? (
                      <GeoMapViewer place={imgUrl.replace('__MAP__', '')} />
                    ) : imgUrl && imgUrl.startsWith('https://flagcdn.com') ? (
                      <ImageBubble url={imgUrl} prompt="flag" />
                    ) : (
                      <ImageBubble
                        url={imgUrl || ''}
                        prompt={
                          imgUrl && imgUrl.startsWith('__GENERATE__')
                            ? imgUrl.replace('__GENERATE__', '')
                            : (msg.imagePrompt || 'abstract art')
                        }
                      />
                    )
                  ) : (
                    <TypewriterMessage content={msg.content} isModel={msg.role === 'model'} />
                  )}
                  {/* Speaker — admin only */}
                  {msg.role === 'model' && !isImg && isAdmin && (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-1">
                      <button onClick={() => speakingIdx === modelIdx ? stopSpeaking() : speakMessage(msg.content, modelIdx)}
                        className={`flex items-center gap-1 px-2 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all border ${speakingIdx === modelIdx ? 'bg-[#008751] text-white border-[#008751]' : 'text-[#008751]/60 border-[#008751]/20 hover:border-[#008751] hover:text-[#008751]'}`}>
                        {speakingIdx === modelIdx ? <VolumeX size={10} className="sm:w-3 sm:h-3" /> : <Volume2 size={10} className="sm:w-3 sm:h-3" />}
                        <span className="hidden sm:inline">{speakingIdx === modelIdx ? 'Speaking...' : 'Listen'}</span>
                      </button>
                      <span className="text-[8px] sm:text-[10px] text-[#008751]/30">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {msg.role === 'model' && !isImg && !isAdmin && (
                    <span className="text-[8px] sm:text-[10px] text-[#008751]/30 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
          {isStreaming && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 sm:gap-3 mr-auto max-w-xs sm:max-w-3xl w-full">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg sm:rounded-xl bg-[#008751]/10 border border-[#008751]/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-1"><img src="/logo.png" alt="BLACK AI" className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg object-cover" /></div>
              <StreamingBubble content={streamingContent} />
            </motion.div>
          )}
          {isLoading && !isStreaming && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 sm:gap-3 mr-auto">
              <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg sm:rounded-xl bg-[#008751]/10 border border-[#008751]/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-1"><img src="/logo.png" alt="BLACK AI" className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg object-cover" /></div>
              <div className="px-3 sm:px-5 py-2 sm:py-4 bg-white border border-[#008751]/15 rounded-lg sm:rounded-2xl rounded-tl-sm flex items-center gap-1">
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight)}
            className="absolute bottom-32 sm:bottom-36 right-4 sm:right-8 p-1.5 sm:p-2 bg-[#008751] text-white rounded-full shadow-lg hover:bg-[#00A862] transition-all z-10">
            <ChevronDown size={16} className="sm:w-5 sm:h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="shrink-0 px-2 pb-2 pt-2 border-t border-[#008751]/15 bg-white w-full safe-area-inset-bottom">
        {attachments.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#008751]/5 border border-[#008751]/20 rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#008751]">
                {att.type === 'image' ? <Image size={10} className="sm:w-3 sm:h-3" /> : <FileAudio size={10} className="sm:w-3 sm:h-3" />}
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{att.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-[#008751]/50 hover:text-red-500 transition-colors"><X size={10} className="sm:w-3 sm:h-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Search bar */}
        <div className="flex items-end gap-2 bg-white border-2 border-[#008751]/20 rounded-lg px-2 py-2 focus-within:border-[#008751] transition-colors w-full">
          <input ref={fileInputRef} type="file" accept="image/*,audio/*" multiple className="hidden" onChange={handleFileSelect} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 sm:p-1.5 text-[#008751]/40 hover:text-[#008751] transition-colors shrink-0 mb-0.5" title="Attach file">
            <Paperclip size={16} className="sm:w-5 sm:h-5" />
          </button>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎤 Recording — click mic to stop...' : `Ask anything about ${languageName}...`}
            rows={1} disabled={isLoading || isStreaming}
            className="flex-1 bg-transparent text-base sm:text-sm text-[#1A1A1A] placeholder-[#008751]/40 outline-none resize-none leading-relaxed max-h-20 overflow-y-auto font-semibold" />
          <button type="button" onClick={startListening}
            className={`p-1.5 rounded-lg transition-all shrink-0 ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-[#008751]/40 hover:text-[#008751] hover:bg-[#008751]/10'}`} title="Voice input">
            <Mic size={18} className="text-gray-700" />
          </button>
          {(isStreaming || isLoading) ? (
            <button type="button" onClick={stopGeneration} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-all shrink-0">
              <Square size={18} className="text-gray-700" fill="currentColor" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={!input.trim() && attachments.length === 0}
              className="p-1.5 bg-[#008751] text-white rounded-lg hover:bg-[#00A862] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
              <Send size={18} className="text-white" />
            </button>
          )}
        </div>

        {/* Section navigation links - REMOVED */}
        {/* Nav links for easy navigation */}
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <a href="/" className="flex items-center gap-1 px-3 py-1 bg-[#008751]/5 border border-[#008751]/20 rounded-full text-xs font-bold text-[#008751] hover:bg-[#008751]/10 transition-all whitespace-nowrap">
            🏠 Home
          </a>
          <a href="/languages" className="flex items-center gap-1 px-3 py-1 bg-[#008751]/5 border border-[#008751]/20 rounded-full text-xs font-bold text-[#008751] hover:bg-[#008751]/10 transition-all whitespace-nowrap">
            🌍 Naija Languages
          </a>
        </div></div>

      {/* Image Generator Modal */}
      <AnimatePresence>
        {showImageGenerator && (
          <ImageGenerator 
            onClose={() => setShowImageGenerator(false)} 
            initialPrompt={imageGeneratorPrompt}
            onImageGenerated={(imageUrl) => {
              // Add image to chat
              const imageMsg: ChatMessage = {
                role: 'model',
                content: `![Generated Image](${imageUrl})`,
                timestamp: Date.now()
              };
              setMessages(prev => [...prev, imageMsg]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
