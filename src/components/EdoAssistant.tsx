import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Volume2, VolumeX, User, Loader2,
  Mic, MicOff, Paperclip, X, Image, FileAudio,
  ChevronDown, StopCircle, Copy, Check, Code2, Square, Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User as FirebaseUser } from 'firebase/auth';
import { getEdoChat, ChatAttachment, transcribeWithWhisper } from '../lib/ai';
import { useLexicon, seedLexiconToFirestore } from '../lib/useLexicon';
import { ChatMessage } from '../types';
import { recordAudioBlob, customAudioCache } from '../lib/voice';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EdoAssistantProps {
  user: FirebaseUser | null;
  isAdmin: boolean;
}

const SUGGESTIONS = [
  { label: 'Greet in Edo', prompt: 'How do I say hello and good morning in Edo?' },
  { label: 'Build a website', prompt: 'Build me a beautiful 3-page website for a restaurant with HTML, CSS and JavaScript' },
  { label: 'Gha mwen app', prompt: 'I hia u gha mwen todo app vbe HTML na CSS' },
  { label: 'Explain science', prompt: 'Explain how black holes work in simple terms' },
  { label: 'Edo culture', prompt: 'Tell me about the Igue festival and Edo culture' },
  { label: 'Gha mwen calculator', prompt: 'Gha mwen calculator vbe JavaScript' },
  { label: 'Lecture me', prompt: 'Give me a lecture on the history of artificial intelligence' },
  { label: 'Translate to Edo', prompt: 'Translate these sentences to Edo: I love you. Where are you going? Thank you very much.' },
];

// ── Code block with copy button ───────────────────────────────────────────
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') ?? 'code';

  const copy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#0A0A0A]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <Code2 size={12} className="text-[#5A5A40]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A]">{lang}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#5A5A5A] hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[#C9D1D9] font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ── Markdown renderer with custom code blocks ─────────────────────────────
function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }: any) {
          const isBlock = !props.inline;
          const text = String(children).replace(/\n$/, '');
          if (isBlock) {
            return <CodeBlock className={className}>{text}</CodeBlock>;
          }
          return (
            <code className="px-1.5 py-0.5 bg-[#2A2A2A] text-[#8A8A60] rounded text-xs font-mono" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2 mt-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2 mt-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold text-[#8A8A60] mb-1 mt-2 uppercase tracking-wide">{children}</h3>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#5A5A40] pl-3 my-2 text-[#8A8A60] italic">{children}</blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-[#2A2A2A] px-3 py-2 bg-[#1A1A1A] text-left font-bold text-[#8A8A60] uppercase tracking-wide">{children}</th>,
        td: ({ children }) => <td className="border border-[#2A2A2A] px-3 py-2 text-[#C9D1D9]">{children}</td>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-[#5A5A40] hover:text-[#8A8A60] underline underline-offset-2 transition-colors">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Streaming message bubble — shows a blinking cursor while streaming ────
function StreamingBubble({ content, done }: { content: string; done: boolean }) {
  return (
    <div className="px-5 py-4 bg-[#1A1A1A] text-[#E5E5E5] rounded-2xl rounded-tl-sm border border-[#2A2A2A] text-sm">
      <MessageContent content={content} />
      {!done && (
        <span className="inline-block w-2 h-4 bg-[#5A5A40] ml-0.5 animate-pulse rounded-sm align-middle" />
      )}
    </div>
  );
}

export default function EdoAssistant({ user, isAdmin }: EdoAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  // Track which AI message index is currently being spoken (null = none)
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const { vocabContextString, trainingContext } = useLexicon();
  const chatRef = useRef<ReturnType<typeof getEdoChat> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const micRecorderRef = useRef<{ stop: () => void } | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    chatRef.current = getEdoChat();
    seedLexiconToFirestore().catch(() => {});
  }, []);

  // Auto-scroll while streaming
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent, isLoading]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakingIdx(null);
  }, []);

  const speakText = useCallback((text: string, idx?: number, onDone?: () => void) => {
    window.speechSynthesis?.cancel();
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    setIsSpeaking(true);
    if (idx !== undefined) setSpeakingIdx(idx);

    // Strip markdown/code blocks for TTS
    const clean = text.replace(/```[\s\S]*?```/g, 'code block').replace(/[*#_`]/g, '');

    // Check if the entire text (trimmed) matches a cached Edo word exactly
    const normalized = clean.toLowerCase().trim();
    if (customAudioCache[normalized]) {
      const audio = new Audio(customAudioCache[normalized]);
      currentAudioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); setSpeakingIdx(null); onDone?.(); };
      audio.onerror = () => { setIsSpeaking(false); setSpeakingIdx(null); onDone?.(); };
      audio.play().catch(() => {
        // fallback to TTS if audio fails
        browserTTS(clean, idx, onDone);
      });
      return;
    }

    // For longer responses, use browser TTS (cache is word-level, not sentence-level)
    browserTTS(clean, idx, onDone);
  }, []);

  const browserTTS = (clean: string, idx?: number, onDone?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.includes('en-NG'))
      || voices.find(v => v.lang.includes('en-GB'))
      || voices.find(v => v.lang.includes('en-US'));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => { setIsSpeaking(false); setSpeakingIdx(null); onDone?.(); };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingIdx(null); onDone?.(); };
    window.speechSynthesis.speak(utterance);
  };

  const speakMessage = useCallback(async (text: string, idx: number) => {
    // Extract candidate Edo words from the response text
    const firstLine = text.split('\n')[0].trim();
    const normalized = firstLine.toLowerCase().replace(/[*#_`\[\]()]/g, '').trim();

    // 1. Check in-memory cache first (populated by useLexicon)
    const cacheKey = Object.keys(customAudioCache).find(k =>
      normalized === k || normalized.startsWith(k) || normalized.includes(k)
    );

    if (cacheKey && customAudioCache[cacheKey]) {
      setIsSpeaking(true);
      setSpeakingIdx(idx);
      const audio = new Audio(customAudioCache[cacheKey]);
      currentAudioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); setSpeakingIdx(null); };
      audio.onerror = () => { speakText(text, idx); };
      audio.play().catch(() => speakText(text, idx));
      return;
    }

    // 2. Cache miss — query Firestore directly for any Edo word in the response
    try {
      const snap = await getDocs(collection(db, 'coreVocabAudio'));
      for (const d of snap.docs) {
        const data = d.data();
        const edoWord = (data.translation || d.id || '').toLowerCase().trim();
        if (edoWord && data.audioUrl && normalized.includes(edoWord)) {
          // Populate cache for future use
          customAudioCache[edoWord] = data.audioUrl;
          setIsSpeaking(true);
          setSpeakingIdx(idx);
          const audio = new Audio(data.audioUrl);
          currentAudioRef.current = audio;
          audio.onended = () => { setIsSpeaking(false); setSpeakingIdx(null); };
          audio.onerror = () => { speakText(text, idx); };
          audio.play().catch(() => speakText(text, idx));
          return;
        }
      }
    } catch (_) { /* fall through to TTS */ }

    // 3. No cached audio found — use browser TTS
    speakText(text, idx);
  }, [speakText]);

  const sendMessage = useCallback(async (text: string, atts: ChatAttachment[] = []) => {
    if ((!text.trim() && atts.length === 0) || isLoading || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);
    abortRef.current = false;

    try {
      if (!chatRef.current) chatRef.current = getEdoChat();

      setIsLoading(false);
      setIsStreaming(true);
      setStreamingContent('');

      let fullText = '';
      const stream = chatRef.current.sendMessageStream({
        message: text,
        attachments: atts,
        vocabContext: [vocabContextString, trainingContext].filter(Boolean).join('\n\n--- ADMIN TRAINING DATA ---\n') || undefined,
      });

      for await (const chunk of stream) {
        if (abortRef.current) break;
        fullText += chunk;
        setStreamingContent(fullText);
      }

      setIsStreaming(false);
      setStreamingContent('');
      const modelMsg: ChatMessage = {
        role: 'model',
        content: fullText,
        timestamp: Date.now(),
      };
      setMessages(prev => {
        const next = [...prev, modelMsg];
        // In voice mode or autoSpeak, speak the new AI message
        // We use the index of the newly added model message
        if ((autoSpeak || voiceMode) && !abortRef.current) {
          const modelIdx = next.filter(m => m.role === 'model').length - 1;
          // Delay slightly to let state settle
          setTimeout(() => speakText(fullText, modelIdx), 100);
        }
        return next;
      });

    } catch (err) {
      console.error('Chat error:', err);
      setIsStreaming(false);
      setStreamingContent('');
      setMessages(prev => [...prev, {
        role: 'model',
        content: 'Ọyese — I encountered an issue. Please try again.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isStreaming, vocabContextString, trainingContext, autoSpeak, voiceMode, speakText]);

  const stopGeneration = () => {
    abortRef.current = true;
    setIsStreaming(false);
    if (streamingContent) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: streamingContent,
        timestamp: Date.now(),
      }]);
      setStreamingContent('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input, attachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Whisper mic ───────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (isListening) {
      micRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    const recorder = recordAudioBlob((status) => {
      if (status === 'error') setIsListening(false);
    });
    micRecorderRef.current = recorder;
    recorder.promise
      .then(async ({ blob }) => {
        setIsListening(false);
        if (voiceMode) {
          // In voice mode: transcribe then auto-send
          setInput('⏳ Transcribing...');
          const transcript = await transcribeWithWhisper(blob);
          setInput('');
          if (transcript) {
            sendMessage(transcript, []);
          }
        } else {
          setInput('⏳ Transcribing...');
          const transcript = await transcribeWithWhisper(blob);
          setInput(transcript || '');
          inputRef.current?.focus();
        }
      })
      .catch(() => { setIsListening(false); setInput(''); });
  }, [isListening, voiceMode, sendMessage]);

  // ── File attach ───────────────────────────────────────────────────────────
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

  // Compute per-message model index for speaker tracking
  // We need to map overall message index → model-only index
  const modelIndexMap: number[] = [];
  let modelCount = 0;
  messages.forEach(msg => {
    if (msg.role === 'model') {
      modelIndexMap.push(modelCount++);
    } else {
      modelIndexMap.push(-1);
    }
  });

  return (
    <div className="flex flex-col h-[100dvh] bg-white text-gray-900 relative overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#008751] to-[#00A862] rounded-2xl flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none text-gray-900">Ọmwan</h1>
            <p className="text-[10px] text-[#008751]/70 font-semibold uppercase tracking-widest">Edo Language & Code AI</p>
          </div>
          <div className="flex items-center gap-1.5 ml-1 px-2 py-1 bg-green-50 rounded-full border border-green-200">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceMode(v => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all border ${voiceMode ? 'bg-red-50 text-red-500 border-red-200' : 'text-gray-500 border-gray-200 hover:border-[#008751] hover:text-[#008751]'}`}>
            <Radio size={10} /> Voice
          </button>
          {isSpeaking && (
            <button onClick={stopSpeaking} className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
              <StopCircle size={10} /> Stop
            </button>
          )}
          {user?.photoURL && <img src={user?.photoURL} alt="" className="w-7 h-7 rounded-full border-2 border-[#008751]/20" referrerPolicy="no-referrer" />}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
        {isEmpty && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#008751] to-[#00A862] rounded-3xl flex items-center justify-center mb-4 shadow-lg">
              <Sparkles size={26} className="text-white" />
            </div>
            <p className="text-[10px] font-black tracking-widest text-[#008751]/50 uppercase mb-1">9jai AI</p>
            <h2 className="text-xl font-bold mb-1 text-gray-900">Kọyo! I am Ọmwan</h2>
            <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">Your Edo language guide. Ask me anything in Edo or English.</p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button key={s.label} onClick={() => sendMessage(s.prompt)}
                  className="p-3 bg-[#008751]/5 border border-[#008751]/20 rounded-xl text-left hover:bg-[#008751]/10 hover:border-[#008751]/40 transition-all">
                  <p className="text-xs font-bold text-[#008751] uppercase tracking-widest">{s.label}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const modelIdx = modelIndexMap[idx];
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="px-4 py-3 bg-[#008751] text-white rounded-2xl rounded-tr-sm text-base font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="px-4 py-3 bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm text-base font-medium leading-relaxed w-full"><MessageContent content={msg.content} /></div>
                  )}
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-2 px-1">
                      <button onClick={() => speakingIdx === modelIdx ? stopSpeaking() : speakMessage(msg.content, modelIdx)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${speakingIdx === modelIdx ? 'bg-[#008751] text-white border-[#008751]' : 'text-[#008751]/60 border-[#008751]/20 hover:border-[#008751] hover:text-[#008751]'}`}>
                        {speakingIdx === modelIdx ? <VolumeX size={10} /> : <Volume2 size={10} />}
                        {speakingIdx === modelIdx ? 'Speaking...' : 'Listen'}
                      </button>
                      <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {isStreaming && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="max-w-[85%] px-4 py-3 bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm text-base font-medium leading-relaxed">
                <MessageContent content={streamingContent} />
                <span className="inline-block w-2 h-4 bg-[#008751] ml-0.5 animate-pulse rounded-sm align-middle" />
              </div>
            </motion.div>
          )}
          {isLoading && !isStreaming && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-gray-100">
                {[0, 150, 300].map((d, i) => <span key={i} className="w-2 h-2 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {showScrollBtn && (
        <button onClick={scrollToBottom} className="absolute bottom-28 right-4 p-2 bg-[#008751] text-white rounded-full shadow-lg z-10">
          <ChevronDown size={16} />
        </button>
      )}

      {/* ── Input area ── */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-gray-200 bg-white">
        {attachments.length > 0 && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1 px-2 py-1 bg-[#008751]/5 border border-[#008751]/20 rounded-lg text-xs text-[#008751]">
                {att.type === 'image' ? <Image size={10} /> : <FileAudio size={10} />}
                <span className="max-w-[80px] truncate">{att.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 bg-gray-100 border-2 border-gray-200 rounded-2xl px-3 py-2 focus-within:border-[#008751] transition-colors">
          <input ref={fileInputRef} type="file" accept="image/*,audio/*" multiple className="hidden" onChange={handleFileSelect} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 text-gray-400 hover:text-[#008751] transition-colors shrink-0">
            <Paperclip size={16} />
          </button>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎤 Recording...' : 'Ask in English or Edo...'}
            rows={1} disabled={isLoading || isStreaming}
            className="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 outline-none resize-none leading-relaxed max-h-24 overflow-y-auto font-semibold caret-[#008751]" />
          <button type="button" onClick={() => setAutoSpeak(v => !v)}
            className={`p-1 shrink-0 rounded-lg transition-all ${autoSpeak ? 'text-[#008751]' : 'text-gray-400 hover:text-[#008751]'}`}>
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button type="button" onClick={startListening}
            className={`p-1 shrink-0 rounded-lg transition-all ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#008751]'}`}>
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          {isStreaming ? (
            <button type="button" onClick={stopGeneration} className="p-1.5 bg-red-100 text-red-500 rounded-xl shrink-0">
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className="p-1.5 bg-[#008751] text-white rounded-xl hover:bg-[#00A862] transition-all disabled:opacity-30 shrink-0">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <a href="/" className="flex items-center gap-1 px-3 py-1 bg-[#008751]/5 border border-[#008751]/20 rounded-full text-xs font-bold text-[#008751] hover:bg-[#008751]/10 transition-all">
            🏠 Home
          </a>
          <a href="/languages" className="flex items-center gap-1 px-3 py-1 bg-[#008751]/5 border border-[#008751]/20 rounded-full text-xs font-bold text-[#008751] hover:bg-[#008751]/10 transition-all">
            🌍 Naija Languages
          </a>
        </div>
      </div>
    </div>
  );
}
