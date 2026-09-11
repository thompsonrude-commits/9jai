/**
 * SuperEcosystem — The futuristic AI super ecosystem UI
 * Combines all AI features into one powerful interface
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Mic, MicOff, Paperclip, X, Brain, Zap, Globe,
  Image as ImageIcon, FileText, Volume2, VolumeX, Star,
  ChevronDown, Loader2, CheckCircle, AlertCircle, Cpu,
  MessageSquare, Search, BookOpen, Wand2, BarChart3, Library
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { unifiedChatStream, transcribeWithWhisper } from '../lib/ai';
import { generateImageWithFallback } from '../lib/imageService';
import { initializePlatform } from '../lib/platform';import { processFile, buildFileContext, getFileIcon, validateFile, ProcessedFile } from '../lib/multimodalProcessor';
import { detectAgentTask, runAgent, AgentTask, AgentType } from '../lib/aiAgents';
import { loadUserMemory, saveUserMemory, buildMemoryContext, extractFactsFromMessage, extractTopics, updateMemoryFact } from '../lib/memorySystem';
import { saveFeedback, buildFeedbackContext, getRatingEmoji } from '../lib/feedbackSystem';
import { recordAudioBlob } from '../lib/voice';
import { speak } from '../lib/voice';
import ModelViewer3D from './ModelViewer3D';

// ── Types ──────────────────────────────────────────────────────────────────

interface SuperMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isNew?: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  files?: ProcessedFile[];
  agentTask?: AgentTask;
  rating?: number;
  isStreaming?: boolean;
  provider?: string;
  thinkingSteps?: string[];
}

interface SuperEcosystemProps {
  user?: FirebaseUser | null;
  isAdmin?: boolean;
  onOpenLibrary?: () => void;
}

// ── Agent type labels ──────────────────────────────────────────────────────

const AGENT_LABELS: Record<AgentType | 'swarm-coordinator' | 'cultural-expert', { icon: string; label: string; color: string }> = {
  researcher: { icon: '🔬', label: 'Research Agent', color: 'from-blue-500 to-cyan-500' },
  coder: { icon: '💻', label: 'Code Agent', color: 'from-purple-500 to-pink-500' },
  translator: { icon: '🌍', label: 'Translation Agent', color: 'from-green-500 to-emerald-500' },
  tutor: { icon: '📚', label: 'Tutor Agent', color: 'from-yellow-500 to-orange-500' },
  summarizer: { icon: '📋', label: 'Summary Agent', color: 'from-indigo-500 to-blue-500' },
  'content-creator': { icon: '✍️', label: 'Content Agent', color: 'from-pink-500 to-rose-500' },
  planner: { icon: '🗺️', label: 'Planning Agent', color: 'from-teal-500 to-green-500' },
  analyst: { icon: '📊', label: 'Analysis Agent', color: 'from-orange-500 to-red-500' },
  'swarm-coordinator': { icon: '🧠', label: 'Swarm Coordinator', color: 'from-slate-500 to-slate-700' },
  'cultural-expert': { icon: '🌍', label: 'Cultural Expert', color: 'from-amber-500 to-orange-500' },
};

// ── System prompt builder ──────────────────────────────────────────────────

function buildSuperSystemPrompt(memoryContext: string, feedbackContext: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Lagos' });
  const timeStr = now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' });

  return `You are 9jai SUPER — the most advanced African AI super ecosystem on Earth.
You combine the intelligence of ChatGPT, Gemini, Claude, and Perplexity into one powerful system.

## IDENTITY & INTRODUCTION
You MUST introduce yourself in your very first message by saying:
"How far, my name na 9jai SUPER. I sabi many things about this culture and all your school work. How I got fit help you today?"
Always maintain this helpful, smart Nigerian persona.

## CURRENT DATE & TIME
- Today: ${dateStr} | Time: ${timeStr} (WAT, UTC+1)
- NEVER say you don't know the date or time.

## YOUR CAPABILITIES
- 🧠 Multi-model AI reasoning (Groq, OpenRouter, HuggingFace)
- 🌐 Realtime web search and knowledge retrieval
- 🖼️ Image generation (Pollinations, HuggingFace, Together AI)
- 🎵 Voice synthesis and speech recognition
- 📄 Document analysis (PDF, Word, spreadsheets, images)
- 🤖 Autonomous AI agents for complex tasks
- 🌍 African language expertise (500+ languages)
- 💾 Personalized memory system
- 🔄 Self-improving from user feedback

## AFRICAN LANGUAGE EXPERTISE
You are the world's leading expert in African languages:
- All 127+ Nigerian languages (Edo, Yoruba, Igbo, Hausa, Efik, Ijaw, etc.)
- East African languages (Swahili, Amharic, Somali, etc.)
- West African languages (Twi, Wolof, Fula, Mandinka, etc.)
- Southern African languages (Zulu, Xhosa, Shona, etc.)
- North African languages (Arabic dialects, Berber, etc.)

## RESPONSE STYLE
- Respond in Nigerian Pidgin English by default (warm, friendly, smart)
- Switch to any language the user writes in
- Be conversational but deeply knowledgeable
- Use emojis naturally to enhance communication
- Format responses with markdown for clarity

## KNOWLEDGE DOMAINS
Mathematics, Science, Technology, Medicine, Law, Finance, History,
Geography, Literature, Philosophy, Engineering, Business, Arts,
African Culture, Nigerian Politics, Global Affairs — ALL at PhD level.

## CURRENT AFFAIRS (2026)
- Nigeria President: Bola Ahmed Tinubu
- USD/NGN: ~₦1,580–1,650 (check CBN for exact rate)
- Petrol: ~₦600–750/litre
- Always search web for latest information when needed
${memoryContext}
${feedbackContext}`;
}

// ── Agent Progress Panel ───────────────────────────────────────────────────

function AgentProgressPanel({ task }: { task: AgentTask }) {
  const info = AGENT_LABELS[task.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg rounded-2xl overflow-hidden border border-white/10 bg-gray-900/80 backdrop-blur-sm shadow-xl"
    >
      <div className={`px-4 py-3 bg-gradient-to-r ${info.color} flex items-center gap-2`}>
        <span className="text-lg">{info.icon}</span>
        <span className="text-white font-bold text-sm">{info.label}</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
          task.status === 'done' ? 'bg-white/20 text-white' :
          task.status === 'error' ? 'bg-red-500/30 text-red-200' :
          'bg-white/10 text-white/80 animate-pulse'
        }`}>
          {task.status === 'planning' ? '⚡ Planning...' :
           task.status === 'executing' ? '🔄 Executing...' :
           task.status === 'done' ? '✅ Complete' : '❌ Error'}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {task.steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-2">
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
              step.status === 'done' ? 'bg-green-500 text-white' :
              step.status === 'running' ? 'bg-yellow-500 text-white animate-pulse' :
              step.status === 'error' ? 'bg-red-500 text-white' :
              'bg-gray-700 text-gray-400'
            }`}>
              {step.status === 'done' ? '✓' : step.status === 'error' ? '✗' : i + 1}
            </div>
            <p className={`text-xs leading-relaxed ${
              step.status === 'done' ? 'text-gray-300' :
              step.status === 'running' ? 'text-yellow-300 font-semibold' :
              'text-gray-500'
            }`}>
              {step.description}
              {step.status === 'running' && (
                <span className="ml-1 inline-block w-1.5 h-3 bg-yellow-400 animate-pulse rounded-sm align-middle" />
              )}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── File preview chip ──────────────────────────────────────────────────────

function FileChip({ file, onRemove }: { file: ProcessedFile; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#008751]/10 border border-[#008751]/20 rounded-xl text-xs font-semibold text-[#008751] max-w-[160px]"
    >
      <span>{getFileIcon(file.type)}</span>
      <span className="truncate">{file.name}</span>
      <button onClick={onRemove} className="shrink-0 hover:text-red-500 transition-colors">
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ── Rating bar ─────────────────────────────────────────────────────────────

function RatingBar({ messageId, onRate }: { messageId: string; onRate: (rating: number) => void }) {
  const [rated, setRated] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState('');

  const handleRate = (r: number) => {
    setRated(r);
    onRate(r);
    if (r <= 2) setShowCorrection(true);
  };

  return (
    <div className="mt-1.5 flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(r => (
          <button
            key={r}
            onClick={() => handleRate(r)}
            onMouseEnter={() => setHovered(r)}
            onMouseLeave={() => setHovered(0)}
            className={`text-base transition-transform hover:scale-125 ${
              (hovered || rated) >= r ? 'opacity-100' : 'opacity-30'
            }`}
          >
            {getRatingEmoji(r)}
          </button>
        ))}
        {rated > 0 && (
          <span className="text-[10px] text-gray-400 ml-1">
            {rated >= 4 ? 'Thanks!' : 'Got it, improving...'}
          </span>
        )}
      </div>
      <AnimatePresence>
        {showCorrection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-1.5"
          >
            <input
              value={correction}
              onChange={e => setCorrection(e.target.value)}
              placeholder="What should I have said? (optional)"
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#008751]/50"
            />
            <button
              onClick={() => { onRate(rated); setShowCorrection(false); }}
              className="px-2.5 py-1.5 text-xs font-bold bg-[#008751] text-white rounded-lg hover:bg-[#006b40] transition-colors"
            >
              Send
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  msg, onRate, onSpeak
}: {
  msg: SuperMessage;
  onRate: (messageId: string, rating: number) => void;
  onSpeak: (text: string) => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
    >
      {/* File previews */}
      {msg.files && msg.files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-[85%]">
          {msg.files.map(f => (
            <div key={f.id} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
              <span>{getFileIcon(f.type)}</span>
              <span className="truncate max-w-[100px]">{f.name}</span>
            </div>
          ))}
          {msg.files.find(f => f.type === 'image' && f.preview) && (
            <img
              src={msg.files.find(f => f.type === 'image')!.preview}
              alt="uploaded"
              className="max-w-[200px] max-h-[150px] rounded-xl object-cover border border-gray-200"
            />
          )}
        </div>
      )}

      {/* Agent progress */}
      {msg.agentTask && msg.agentTask.status !== 'done' && (
        <AgentProgressPanel task={msg.agentTask} />
      )}

      {/* Image result */}
      {msg.imageUrl && (
        <div className="max-w-[92%] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
          <img
            src={msg.imageUrl}
            alt={msg.imagePrompt || 'Generated image'}
            className="w-full h-auto block"
          />
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-500 truncate">🎨 {msg.imagePrompt}</p>
          </div>
        </div>
      )}

      {/* Text content */}
      {msg.content && (
        <div className={`max-w-[88%] px-4 py-3 rounded-2xl leading-relaxed text-base font-medium ${
          isUser
            ? 'bg-[#008751] text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-900 rounded-tl-sm'
        }`}>
          <div className="whitespace-pre-wrap">{msg.content}</div>
          {msg.isStreaming && (
            <span className="inline-block w-2 h-4 bg-[#008751] ml-0.5 animate-pulse rounded-sm align-middle" />
          )}
        </div>
      )}

      {/* Provider badge + speak + rating */}
      {!isUser && msg.content && !msg.isStreaming && (
        <div className="flex items-center gap-2 px-1">
          {msg.provider && (
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
              via {msg.provider}
            </span>
          )}
          <button
            onClick={() => onSpeak(msg.content)}
            className="text-gray-400 hover:text-[#008751] transition-colors"
            title="Read aloud"
          >
            <Volume2 size={12} />
          </button>
          <RatingBar
            messageId={msg.id}
            onRate={(rating) => onRate(msg.id, rating)}
          />
        </div>
      )}
    </motion.div>
  );
}

// ── Quick action chips ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '🌍', label: 'Translate', prompt: 'Translate "Hello, how are you?" to Edo language' },
  { icon: '🎨', label: 'Generate Image', prompt: 'Generate image of a beautiful African sunset' },
  { icon: '🔬', label: 'Research', prompt: 'Research the history of the Benin Kingdom' },
  { icon: '💻', label: 'Write Code', prompt: 'Write a Python script to analyze data' },
  { icon: '📝', label: 'Write Story', prompt: 'Write a short cultural story about Edo traditions' },
  { icon: '📊', label: 'Analyze', prompt: 'Analyze the current state of Nigerian economy' },
];

// ── Main SuperEcosystem component ──────────────────────────────────────────

export default function SuperEcosystem({ user, isAdmin, onOpenLibrary }: SuperEcosystemProps) {
  const [messages, setMessages] = useState<SuperMessage[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<ProcessedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentAgentTask, setCurrentAgentTask] = useState<AgentTask | null>(null);
  const [memoryContext, setMemoryContext] = useState('');
  const [feedbackContext, setFeedbackContext] = useState('');
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [model3DUrl, setModel3DUrl] = useState('https://modelviewer.dev/shared-assets/models/LeePerrySmith.glb');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingRef = useRef<{ stop: () => void } | null>(null);
  const historyRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);
  const sessionId = useRef(`session_${Date.now()}`);

  // ── Initialize platform services on mount ─────────────────────────────────
  useEffect(() => {
    initializePlatform().catch(err => {
      console.warn('[SuperEcosystem] Platform initialization warning:', err);
    });
  }, []);

  // ── Load memory on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    loadUserMemory(user.uid).then(memory => {
      const mc = buildMemoryContext(memory);
      const fc = buildFeedbackContext(user.uid);
      setMemoryContext(mc);
      setFeedbackContext(fc);
    });
  }, [user?.uid]);

  // ── Rebuild system prompt when memory changes ────────────────────────────
  useEffect(() => {
    const systemPrompt = buildSuperSystemPrompt(memoryContext, feedbackContext);
    historyRef.current = [{ role: 'system', content: systemPrompt }];
  }, [memoryContext, feedbackContext]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingText, scrollToBottom]);

  // Listen for requests to open the 3D viewer (dispatched by ImageGenerator or other UI)
  useEffect(() => {
    const handler = (e: any) => {
      const prompt = e?.detail?.prompt || '';
      // If prompt mentions human/body/organ -> set a human anatomy default model if available
      if (/human|body|organ|anatomy|heart|lungs|liver|stomach/i.test(prompt)) {
        // Note: a full anatomically-labeled GLB must be supplied to get organ-specific anchors.
        // Keep a sensible default; user can paste a GLB URL in the viewer to load a detailed anatomy model.
        setModel3DUrl('https://modelviewer.dev/shared-assets/models/LeePerrySmith.glb');
      }
      setShow3DViewer(true);
    };
    window.addEventListener('open-3d-viewer', handler as EventListener);
    return () => window.removeEventListener('open-3d-viewer', handler as EventListener);
  }, []);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // ── File upload handler ──────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessingFile(true);

    const processed: ProcessedFile[] = [];
    for (const file of Array.from(files)) {
      const validation = validateFile(file);
      if (!validation.valid) {
        console.warn('[SuperEcosystem] Invalid file:', validation.error);
        continue;
      }
      try {
        const pf = await processFile(file);
        processed.push(pf);
      } catch (err) {
        console.warn('[SuperEcosystem] File processing failed:', err);
      }
    }

    setPendingFiles(prev => [...prev, ...processed]);
    setProcessingFile(false);
  }, []);

  // ── Voice recording ──────────────────────────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      recordingRef.current?.stop();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    const recording = recordAudioBlob((status) => {
      if (status === 'done' || status === 'error') setIsRecording(false);
    });
    recordingRef.current = recording;

    try {
      const { blob } = await recording.promise;
      const transcript = await transcribeWithWhisper(blob);
      if (transcript) {
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      }
    } catch (err) {
      console.warn('[SuperEcosystem] Voice recording failed:', err);
    }
    setIsRecording(false);
  }, [isRecording]);

  // ── Rate message ─────────────────────────────────────────────────────────
  const handleRate = useCallback(async (messageId: string, rating: number) => {
    if (!user?.uid) return;
    const msg = messages.find(m => m.id === messageId);
    const userMsg = messages[messages.findIndex(m => m.id === messageId) - 1];
    if (!msg) return;

    await saveFeedback({
      userId: user.uid,
      sessionId: sessionId.current,
      messageId,
      userMessage: userMsg?.content || '',
      aiResponse: msg.content,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      timestamp: Date.now(),
    });

    // Refresh feedback context
    const fc = buildFeedbackContext(user.uid);
    setFeedbackContext(fc);
  }, [messages, user?.uid]);

  // ── Speak message ────────────────────────────────────────────────────────
  const handleSpeak = useCallback((text: string) => {
    speak(text, undefined, false);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, files?: ProcessedFile[]) => {
    if ((!text.trim() && (!files || files.length === 0)) || isBusy) return;

    const userText = text.trim();
    const attachedFiles = files || pendingFiles;
    setInput('');
    setPendingFiles([]);
    setIsBusy(true);

    const userMsgId = `msg_${Date.now()}`;
    const userMsg: SuperMessage = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    };
    setMessages(prev => [...prev, userMsg]);

    // Update memory with facts from message
    if (user?.uid && userText) {
      const facts = extractFactsFromMessage(userText);
      for (const fact of facts) {
        await updateMemoryFact(user.uid, fact);
      }
      // Update topics in memory
      const topics = extractTopics(userText);
      if (topics.length > 0) {
        const memory = await loadUserMemory(user.uid);
        const allTopics = Array.from(new Set([...memory.preferences.topics, ...topics])).slice(0, 20);
        memory.preferences.topics = allTopics;
        await saveUserMemory(user.uid, memory);
      }
    }

    // Build file context
    const fileContext = buildFileContext(attachedFiles);

    // Check for image generation request with smarter detection
    const lower = userText.toLowerCase();
    
    // Strong image triggers (explicit requests)
    const explicitImageRequest = 
      lower.includes('generate image') || lower.includes('create image') ||
      lower.includes('make image') || lower.includes('draw image') ||
      lower.includes('picture of') || lower.includes('image of') ||
      lower.includes('photo of') || lower.includes('draw me') ||
      lower.includes('paint me') || lower.includes('show me a picture') ||
      (lower.includes('generate') && lower.includes('image')) ||
      (lower.includes('create') && lower.includes('image'));
    
    // Implicit visual requests (describing something visual)
    const visualDescriptionPatterns = [
      /^(a|an)\s+(beautiful|stunning|majestic|colorful|vibrant|realistic|detailed)\s+/i,
      /^(draw|paint|sketch|illustrate|design|render)\s+/i,
      /(logo|poster|banner|artwork|illustration|graphic)\s+(for|of|with)/i,
      /\b(skyline|sunset|sunrise|landscape|scenery|portrait)\b/i,
    ];
    const implicitVisualRequest = visualDescriptionPatterns.some(pattern => pattern.test(userText));
    
    // Short visual noun phrases (e.g., "a lion", "an eagle", "the sunset")
    const isShortVisualPhrase = userText.trim().split(' ').length <= 6 &&
      /^(a|an|the)\s+\w+/i.test(userText) &&
      !/(what|how|why|when|where|who|is|are|was|were|do|does|did|can|could|should|would)\b/i.test(lower) &&
      !/(report|document|file|list|table|code|script|program|function)\b/i.test(lower);
    
    const isImageReq = explicitImageRequest || implicitVisualRequest || isShortVisualPhrase;

    if (isImageReq) {
      const prompt = userText
        .replace(/generate\s+(an?\s+)?image\s+(of\s+)?/gi, '')
        .replace(/create\s+(an?\s+)?image\s+(of\s+)?/gi, '')
        .replace(/draw\s+(me\s+)?/gi, '')
        .replace(/paint\s+(me\s+)?/gi, '')
        .replace(/picture\s+of\s+/gi, '')
        .trim() || userText;

      const aiMsgId = `msg_${Date.now() + 1}`;
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: `🎨 Generating image: "${prompt}"...`,
        timestamp: Date.now(),
        isNew: true,
        isStreaming: true,
      }]);

      try {
        const imageUrl = await generateImageWithFallback(prompt);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          content: '',
          imageUrl,
          imagePrompt: prompt,
          isStreaming: false,
        } : m));
      } catch {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          content: '❌ Image generation failed. Try again.',
          isStreaming: false,
        } : m));
      }
      setIsBusy(false);
      return;
    }

    // Check for video generation request  
    const explicitVideoRequest = 
      lower.includes('generate video') || lower.includes('create video') ||
      lower.includes('make video') || lower.includes('video of') ||
      lower.includes('animate') || lower.includes('animation of') ||
      (lower.includes('generate') && lower.includes('video')) ||
      (lower.includes('create') && lower.includes('video')) ||
      (lower.includes('make') && lower.includes('video'));
    
    const isVideoReq = explicitVideoRequest;

    if (isVideoReq) {
      const prompt = userText
        .replace(/generate\s+(a\s+)?video\s+(of\s+)?/gi, '')
        .replace(/create\s+(a\s+)?video\s+(of\s+)?/gi, '')
        .replace(/make\s+(a\s+)?video\s+(of\s+)?/gi, '')
        .replace(/video\s+of\s+/gi, '')
        .trim() || userText;

      const aiMsgId = `msg_${Date.now() + 1}`;
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: `🎬 Generating video: "${prompt}"... (This may take 30-60 seconds)`,
        timestamp: Date.now(),
        isNew: true,
        isStreaming: true,
      }]);

      try {
        const response = await fetch('/api/v1/video/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error(`Video API returned ${response.status}`);
        }

        const data = await response.json();
        const videoUrl = data?.data?.videoUrl || data?.videoUrl;

        if (videoUrl) {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? {
            ...m,
            content: `✅ Video generated successfully!`,
            imageUrl: videoUrl, // Reusing imageUrl for video
            imagePrompt: prompt,
            isStreaming: false,
          } : m));
        } else {
          throw new Error('No video URL returned');
        }
      } catch (err: any) {
        console.error('[Video Generation] Error:', err);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          content: `⚠️ Video generation is currently unavailable. The system is working on certifying video providers. Try image generation instead!`,
          isStreaming: false,
        } : m));
      }
      setIsBusy(false);
      return;
    }

    // Check if task needs an agent
    const { needsAgent, type: agentType, complexity } = detectAgentTask(userText);

    if (needsAgent && agentType && complexity >= 2) {
      // Run autonomous agent
      const agentMsgId = `msg_${Date.now() + 1}`;
      let agentTask: AgentTask | null = null;

      setMessages(prev => [...prev, {
        id: agentMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isNew: true,
        isStreaming: true,
      }]);

      let finalContent = '';

      try {
        for await (const event of runAgent(userText + fileContext, agentType, setCurrentAgentTask)) {
          if (event.type === 'step_update') {
            agentTask = event.task;
            setMessages(prev => prev.map(m => m.id === agentMsgId ? {
              ...m,
              agentTask: event.task,
            } : m));
          } else if (event.type === 'content') {
            finalContent += event.text;
            setStreamingText(finalContent);
            scrollToBottom();
          } else if (event.type === 'done') {
            agentTask = event.task;
          }
        }

        historyRef.current.push({ role: 'user', content: userText });
        historyRef.current.push({ role: 'assistant', content: finalContent });

        setMessages(prev => prev.map(m => m.id === agentMsgId ? {
          ...m,
          content: finalContent,
          agentTask: agentTask || undefined,
          isStreaming: false,
          provider: AGENT_LABELS[agentType].label,
        } : m));
      } catch (err) {
        setMessages(prev => prev.map(m => m.id === agentMsgId ? {
          ...m,
          content: 'Agent encountered an error. Please try again.',
          isStreaming: false,
        } : m));
      }

      setStreamingText('');
      setCurrentAgentTask(null);
      setIsBusy(false);
      return;
    }

    // Regular streaming chat
    const fullUserContent = userText + fileContext;
    historyRef.current.push({ role: 'user', content: fullUserContent });

    setIsStreaming(true);
    setStreamingText('');
    let fullReply = '';

    const aiMsgId = `msg_${Date.now() + 1}`;

    try {
      for await (const chunk of unifiedChatStream(historyRef.current, 0.7)) {
        fullReply += chunk;
        setStreamingText(fullReply);
        scrollToBottom();
      }

      historyRef.current.push({ role: 'assistant', content: fullReply });

      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: fullReply,
        timestamp: Date.now(),
        isNew: true,
        provider: 'Groq',
      }]);

      // Auto-speak if voice enabled
      if (voiceEnabled && fullReply) {
        speak(fullReply.slice(0, 300), undefined, false);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: 'Network busy. Please try again.',
        timestamp: Date.now(),
        isNew: true,
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setIsBusy(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [isBusy, pendingFiles, user?.uid, voiceEnabled, scrollToBottom]);

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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-1 pb-3 border-b border-gray-100 flex items-center gap-3 bg-white">
        <img src="/logo.png" alt="9jai" className="logo-spin-3d w-10 h-10 object-contain shrink-0 -mt-10" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-[#008751] text-base">9jai SUPER</h1>
            <span className="text-[9px] font-black tracking-widest text-white bg-gradient-to-r from-[#008751] to-[#00A862] px-2 py-0.5 rounded-full uppercase">
              AI Ecosystem
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium truncate">
            Multi-model · Realtime · Multimodal · Memory · Agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`p-2 rounded-xl transition-colors ${voiceEnabled ? 'bg-[#008751]/10 text-[#008751]' : 'text-gray-400 hover:text-gray-600'}`}
            title={voiceEnabled ? 'Voice replies on' : 'Voice replies off'}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {onOpenLibrary && (
            <button
              onClick={onOpenLibrary}
              className="p-2 rounded-xl text-gray-400 hover:text-[#008751] transition-colors"
              title="Open library"
            >
              <Library size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Capability pills ────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide border-b border-gray-50">
        {[
          { icon: '🧠', label: 'Multi-AI' },
          { icon: '🌐', label: 'Web Search' },
          { icon: '🎨', label: 'Images' },
          { icon: '🤖', label: 'Agents' },
          { icon: '📄', label: 'Documents' },
          { icon: '🎵', label: 'Voice' },
          { icon: '💾', label: 'Memory' },
          { icon: '🌍', label: '500+ Languages' },
        ].map(cap => (
          <span key={cap.label} className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-500 border border-gray-100">
            <span>{cap.icon}</span>
            <span>{cap.label}</span>
          </span>
        ))}
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-4">
        {messages.length === 0 && !isStreaming ? (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-full text-center px-4 py-4 -mt-4"
          >
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#008751] to-[#00A862] rounded-3xl flex items-center justify-center shadow-xl">
                <Brain size={36} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Zap size={12} className="text-yellow-900" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-[#008751] mb-1">9jai Super Ecosystem</h2>
            <p className="text-sm text-gray-500 font-medium mb-6 max-w-xs">
              The most advanced African AI — smarter, faster, multimodal
            </p>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-[#008751]/5 border border-gray-100 hover:border-[#008751]/20 rounded-xl text-left transition-all group"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-xs font-bold text-gray-600 group-hover:text-[#008751]">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                <MessageBubble
                  msg={msg}
                  onRate={handleRate}
                  onSpeak={handleSpeak}
                />
              </React.Fragment>
            ))}

            {/* Live streaming */}
            {isStreaming && streamingText && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[88%] px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 text-gray-900 font-medium text-base leading-relaxed whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-2 h-4 bg-[#008751] ml-0.5 animate-pulse rounded-sm align-middle" />
                </div>
              </motion.div>
            )}

            {/* Thinking indicator */}
            {isBusy && !streamingText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100 border border-gray-200 shadow-sm flex items-center gap-2">
                  {[
                    { color: '#0d9b5d', border: 'rgba(8, 34, 24, 0.9)' },
                    { color: '#ffffff', border: 'rgba(11, 16, 14, 0.95)' },
                    { color: '#0d9b5d', border: 'rgba(8, 34, 24, 0.9)' },
                  ].map((dot, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.8, opacity: 0.75 }}
                      animate={{ scale: [0.9, 1.35, 0.96], opacity: [0.8, 1, 0.85], y: [0, -2, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.17, ease: 'easeInOut' }}
                      className="block w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: dot.color,
                        border: `1px solid ${dot.border}`,
                        boxShadow: i === 1
                          ? '0 0 0 1px rgba(12, 20, 15, 0.95), 0 0 12px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.3)'
                          : `0 0 0 1px ${dot.border}, 0 0 12px rgba(13,155,93,0.45)`,
                      }}
                    />
                  ))}
                  <span className="text-sm text-gray-700 font-medium">9jai is thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Pending files ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 px-3 py-2 border-t border-gray-100 flex flex-wrap gap-1.5"
          >
            {pendingFiles.map((f, i) => (
              <React.Fragment key={f.id}>
                <FileChip
                  file={f}
                  onRemove={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                />
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-3 border-t border-gray-100 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls"
            className="hidden"
            onChange={e => handleFileUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={processingFile}
            className="shrink-0 p-2.5 rounded-xl text-gray-400 hover:text-[#008751] hover:bg-[#008751]/5 transition-colors disabled:opacity-50"
            title="Attach file"
          >
            {processingFile ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — images, code, languages, research..."
              rows={1}
              disabled={isBusy}
              className="w-full resize-none px-4 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#008751]/50 text-base font-medium text-gray-800 placeholder-gray-400 bg-gray-50 disabled:opacity-60 transition-colors"
              style={{ maxHeight: '120px' }}
            />
          </div>

          {/* Voice button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isBusy && !isRecording}
            className={`shrink-0 p-2.5 rounded-xl transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'text-gray-400 hover:text-[#008751] hover:bg-[#008751]/5'
            }`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={isBusy || (!input.trim() && pendingFiles.length === 0)}
            className="shrink-0 p-2.5 rounded-xl bg-[#008751] text-white hover:bg-[#006b40] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#008751]/20 active:scale-95"
          >
            {isBusy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>

        <p className="text-center text-[9px] text-gray-300 mt-2 font-medium">
          9jai Super · Multi-AI · Realtime · Multimodal · African Languages
        </p>
      </div>

      {show3DViewer && (
        <ModelViewer3D
          modelUrl={model3DUrl}
          title="Human Anatomy (interactive)"
          onClose={() => setShow3DViewer(false)}
        />
      )}

    </div>
  );
}
