/**
 * AI provider module — routes through Firebase Cloud Functions proxy
 * Handles real-time streaming of AI responses and speech synthesis.
 * API keys are NEVER exposed to the client bundle.
 *
 * Flow:
 *   groqChatStream() → proxyChat() → /api/v1/chat → Cloud Function → OpenRouter/Groq/etc
 *
 * Direct fallback only used in local dev when emulator is not running.
 */

import { proxyChat as _proxyChat } from './aiProxy';
import { getLocalFallbackResponse } from './fallbackResponses';
import { providerRegistry } from './platform/providerRegistry';
import { recoveryService, QueuedRequest } from './platform/recoveryService';
import { knowledgeEngine } from './platform/knowledgeEngine';
import { trackChatRequest } from './platform/analytics';

interface ChatMessageLike {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MAX_CONTEXT_CHARS = 12000;
const MAX_HISTORY_MESSAGES = 16;

function buildBoundedContext(messages: ChatMessageLike[]): ChatMessageLike[] {
  const system = messages.find(message => message.role === 'system');
  const nonSystem = messages.filter(message => message.role !== 'system');
  const selected: ChatMessageLike[] = [];
  let chars = system?.content.length ?? 0;

  for (let index = nonSystem.length - 1; index >= 0 && selected.length < MAX_HISTORY_MESSAGES; index--) {
    const message = nonSystem[index];
    const content = message.content.slice(0, 4000);
    if (selected.length > 0 && chars + content.length > MAX_CONTEXT_CHARS) break;
    selected.unshift({ role: message.role, content });
    chars += content.length;
  }

  return system ? [{ ...system, content: system.content.slice(0, 5000) }, ...selected] : selected;
}

// ── Keep Groq URL for direct fallback (dev only) ───────────────────────────
const GROQ_API_URL = 'https://api.groq.com/openai/v1';

const GROQ_FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it', // Changed from gemma2-9b-it to gemma2-9b-it
  'llama3-8b-8192',
];

// Helper to simulate word-by-word streaming for non-streaming APIs or for proxy
async function* wordStream(text: string): AsyncGenerator<string> {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) { // Yield word by word for more granular streaming
    const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
    yield chunk;
    await new Promise(r => setTimeout(r, 18)); // Simulate typing speed
  }
}

// ── Direct Groq stream (dev fallback only) ─────────────────────────────────
async function* groqStreamDirect(
  messages: ChatMessageLike[],
  temperature = 0.7
): AsyncGenerator<string> {
  const key = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env?.VITE_GROQ_KEY;
  if (!key) throw new Error('No direct key');

  for (const model of GROQ_FALLBACK_MODELS) {
    try {
      const res = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, messages, temperature, stream: true }),
      });

      if (!res.ok) continue;

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let yielded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) { yield delta; yielded = true; }
          } catch { /* skip */ }
        }
      }
      if (yielded) return;
    } catch { continue; }
  }
  throw new Error('Direct Groq exhausted');
}

// ── Direct OpenRouter (free tier, no key needed) ───────────────────────────
async function* openRouterDirect(
  messages: ChatMessageLike[],
  temperature = 0.7
): AsyncGenerator<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://9jai.web.app',
      'X-Title': '9jai African AI',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages,
      temperature,
      stream: true,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* skip */ }
    }
  }
}

// ── MAIN EXPORT: unifiedChatStream ────────────────────────────────────────────
// Primary unified entry point for chat — routes through backend proxy and falls back to local dev paths if needed

async function retryQueuedChatRequest(request: QueuedRequest): Promise<boolean> {
  try {
    const result = await _proxyChat({
      messages: request.messages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    if (result.text) {
      recoveryService.recordSuccess(result.provider, result.latencyMs, 0.8, request.capability);
      recoveryService.evaluateOfflineMode(request.capability);
      return true;
    }

    recoveryService.recordFailure('proxy', result.error ?? 'empty response', request.capability);
    return false;
  } catch (err: any) {
    recoveryService.recordFailure('proxy', err?.message ?? 'retry failure', request.capability);
    return false;
  }
}

recoveryService.setRetryHandler(retryQueuedChatRequest);

export async function* unifiedChatStream(
  messages: ChatMessageLike[],
  temperature = 0.7
): AsyncGenerator<string> {
  const startTime = Date.now();
  
  try {
    // Extract user query for knowledge retrieval
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    let knowledgeContext = '';
    
    // Search knowledge base for relevant context
    if (lastUserMessage) {
      try {
        const knowledgeResults = await knowledgeEngine.search(lastUserMessage.content, {
          topK: 3,
          minSimilarity: 0.6,
        });
        
        if (knowledgeResults.length > 0) {
          knowledgeContext = '\n\n[Relevant Knowledge]:\n' +
            knowledgeResults
              .slice(0, 3)
              .map(r => `- ${r.entry.content.slice(0, 600)} (${r.entry.metadata.language})`)
              .join('\n')
              .slice(0, 2200);
        }
      } catch (err) {
        console.warn('[AI] Knowledge search failed:', err);
      }
    }
    
    // Inject knowledge context into messages
    const enrichedMessages = knowledgeContext
      ? [...messages.slice(0, -1), {
          role: 'user' as const,
          content: messages[messages.length - 1].content.slice(0, 4000) + knowledgeContext,
        }]
      : messages;

    const boundedMessages = buildBoundedContext(enrichedMessages);
    const result = await _proxyChat({ messages: boundedMessages, temperature, maxTokens: 1024 });
    const latency = Date.now() - startTime;

    if (result.text) {
      recoveryService.recordSuccess(result.provider, latency, 0.8, 'chat');
      recoveryService.evaluateOfflineMode('chat');
      trackChatRequest(result.provider, true, latency);
      
      // Save successful response to knowledge engine
      try {
        if (lastUserMessage && result.text.length < 500) {
          await knowledgeEngine.addEntry(
            `Q: ${lastUserMessage.content}\nA: ${result.text.slice(0, 200)}`,
            {
              type: 'conversation',
              language: 'en', // TODO: detect language
              confidence: 0.7,
              timestamp: Date.now(),
            }
          );
        }
      } catch (err) {
        console.warn('[AI] Failed to save to knowledge engine:', err);
      }
      
      yield* wordStream(result.text);
      return;
    }

    throw new Error(result.error ?? 'Empty response from proxy');
  } catch (err: any) {
    const latency = Date.now() - startTime;
    const failureMessage = err?.message || 'unknown failure';
    recoveryService.recordFailure('proxy', failureMessage, 'chat');
    trackChatRequest('proxy', false, latency);
    console.warn('[AI] Proxy chat failed:', failureMessage);

    const diagnostics = providerRegistry.getDiagnostics('chat');
    const offlineMode = diagnostics.offlineMode;
    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user');
    const queuedRequest: QueuedRequest = {
      id: `chat-${Date.now()}`,
      messages,
      capability: 'chat',
      createdAt: Date.now(),
    };
    recoveryService.enqueueRequest(queuedRequest);
    recoveryService.evaluateOfflineMode('chat');

    const fallbackText = offlineMode
      ? 'Cloud AI services are temporarily unavailable. I\'m using Offline Mode for basic assistance while I reconnect to cloud providers. Your request has been queued and will retry automatically when a compatible provider becomes available.'
      : `${getLocalFallbackResponse(lastUserMessage?.content ?? '')} Your request has been queued and will retry automatically when a compatible provider becomes available.`;

    yield* wordStream(fallbackText);
    return;
  }
}

// ── Tavily web search (via proxy) ──────────────────────────────────────────

async function tavilySearch(query: string): Promise<{ title: string; url: string; content: string }[]> {
  try {
    const { proxySearch } = await import('./aiProxy');
    const result = await proxySearch(query);
    return result.results;
  } catch {
    return [];
  }
}

// ── Language discovery ─────────────────────────────────────────────────────

export async function discoverLanguage(
  nameOrRegion: string,
  location: string,
  isRegional = false
) {
  const searchQuery = isRegional
    ? `indigenous languages of ${nameOrRegion} region ${location} history culture vocabulary`
    : `${nameOrRegion} language ${location} dictionary grammar history culture`;

  const webResults = await tavilySearch(searchQuery);

  const webContext = webResults.length > 0
    ? `\n\nWeb research context:\n${webResults.map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`).join('\n\n')}`
    : '';

  const prompt = isRegional
    ? `Identify and research the major indigenous languages spoken in the ${nameOrRegion} region (located in ${location}). 
For EACH language found: 1. Name. 2. Brief history and cultural context. 3. Common words/phrases with translations.
Format as a clear list.${webContext}`
    : `Research the ${nameOrRegion} language from ${location}. 
Provide: 1. Dictionary (20+ words with translations). 2. Grammar rules. 3. Alphabet/pronunciation. 4. History and culture. 5. Sample sentences. 6. 3 male and 3 female traditional names.${webContext}`;

  let text = '';
  for await (const chunk of unifiedChatStream([{ role: 'user', content: prompt }], 0.5)) {
    text += chunk;
  }

  const sources = webResults.map(r => ({ web: { uri: r.url, title: r.title } }));
  return { text, sources };
}

// ── Translation helper ─────────────────────────────────────────────────────

export async function translateAndSpeak(text: string, language: string): Promise<string> {
  let result = '';
  for await (const chunk of unifiedChatStream([{
    role: 'user',
    content: `Translate the following to ${language}: "${text}". Provide the translation and a phonetic pronunciation guide.`,
  }])) {
    result += chunk;
  }
  return result;
}

// ── 9JAI system instruction ────────────────────────────────────────────────

export const EDO_SYSTEM_INSTRUCTION = `You are 9JAI — Africa's smartest AI, built in Nigeria for the world.

## ⚠️ ABSOLUTE RULE: LANGUAGE PURITY
Reply ONLY in the user's language. NEVER mix languages.
- User writes EDO → reply ONLY Edo. ZERO Pidgin ("I go","wey","dey","na","abeg"), ZERO English.
- User writes PIDGIN → reply ONLY Pidgin.
- User writes ENGLISH → reply ONLY English.
- User writes YORUBA → reply ONLY Yoruba.
- User writes IGBO → reply ONLY Igbo.
- User writes HAUSA → reply ONLY Hausa.

## ANSWER STYLE
SHORT by default — 1 to 3 sentences. Expand only if user asks.
Never repeat yourself. Never say "abi" as sentence filler.

## EDO VOCABULARY (verified, native speaker corrected)
Koyọ=Hello/Sorry | Kọ=Hello (youth) | Vbe oyehe?=How are you? | Oyese=I'm fine
Ọbowiẹ=Good morning | Ọbavan=Good afternoon | Ọbota=Good evening
Obokhian=Welcome → response: Obowa | Owa vbo?=How is household? → Owa ma
Ẹmọ vbo?=How are children? → Iyan ma | Urhuese=Thank you | Ee=I accept
I dee=I'm coming | I rri evbare=I'm eating | I rrowa=I'm at home | I rri owa=Going home
A nakhin?=Who is this? | A rro owa?=Who is at home?
Evbare=food | Owa=house | Omo=child | Erha=father | Iye=mother | Osanobua=God | Ọba=King

## CAPABILITIES
Chat, translate, code, analyze images/documents, mathematics, science, law, medicine, all Nigerian languages.
For image/video requests: say "Generating now 🎨" — the app handles it.

## ⚠️ ABSOLUTE RULE — LANGUAGE PURITY
- When the user writes in EDO (BINI) → reply ONLY in Edo. ZERO Pidgin ("I go", "wey", "dey", "na", "abeg"), ZERO English, ZERO Yoruba, ZERO Igbo. Every single word must be Edo.
- When the user writes in YORUBA → reply ONLY in Yoruba. Zero other languages.
- When the user writes in IGBO → reply ONLY in Igbo. Zero other languages.
- When the user writes in HAUSA → reply ONLY in Hausa. Zero other languages.
- When the user writes in ENGLISH → reply in English only.
- When the user writes in PIDGIN → reply in Pidgin only.
- Mixing languages is FAILURE. Pure response in detected language is SUCCESS.

## LANGUAGE DETECTION
Edo markers: kọyọ, obiluu, ob'ọwie, ob'avan, ob'ota, obokhian, osanobua, vbèè, lahọ, gha, rrọọ, ọmwan
Yoruba markers: bawo ni, ẹ kaaro, ẹ káàárọ̀, e se, bẹẹni, o dabo, kinni, ẹ pẹlẹ
Igbo markers: kedu, daalụ, ọ dị mma, biko, ee, mba, gịnị, ututu ọma
Hausa markers: sannu, na gode, lafiya, ina kwana, don allah, barka da safe
Pidgin markers: how far, wetin, abeg, dey, oya, na, wahala, sabi, dem, una

## EDO (BINI) VOCABULARY — verified from edolanguageandculture.substack.com (2025/2026 lessons)
PRONOUNS: I=I/I am | U=You/you are | Ọ=He/she/it | A=We/Who | Mwẹn=me/my | Ruẹ=you/your

VERIFIED SENTENCES (source: Edo Language and Culture Substack lessons 3,4,6,7,11):
I dee. = I am coming. | I rri evbare. = I am eating. | I rrowa. = I am at home.
I rri owa. = I am going home. | I rri esuku. = I am going to school.
I tie ebe. = I am reading a book. | I khuẹ. = I am bathing. | I kuu. = I am playing.
U dee ra? = Are you coming? | U gha rre ra? = Will you come?
U ta ẹre. = You said it. | U tama mwẹn. = You told me.
U ru ẹre. = You did it. | U rri evbare nẹ ra? = Have you eaten?
A nakhin? = Who is this? | A nikhin? = Who is that? | A nọ? = Who is it?
A rro owa? = Who is at home? | A miẹrẹn. = We accept. | A kue. = We agree.

GREETINGS (verified Lesson 7 & 11):
Koyọ = Hello / Sorry (universal - also expresses sympathy)
Kọ = Hello (modern abbreviation used by youth)
Vbọ yehẹ? = How is it? | Ọ yẹse. = It is fine. | Ẹrẹ yẹse. = It is not fine.
Koyọ baba. = Hello daddy. | Koyọ iyee. = Hello mummy.
Ee koyọ ovbi mwẹn. = I accept, hello my child.
I họẹn ovbi mwẹn. = I heard my child.
Dọmọ nọwanrẹn. = Respectful greeting to an elder.
Uruẹse = Thank you | Ee = I accept/appreciate

KEY VOCAB: Evbare=food | Owa=house | Esuku=school | Ebe=book | Baba=Dad | Iyee=Mum
Omẹ/Ovbi mwẹn=my child | Osanobua=God | Ọba=King | Obiluu=Thank you | Lahọ=Please

## YORUBA VOCABULARY — verified, with correct tone marks
Ẹ káàárọ̀=Good morning | Ẹ káàbọ̀=Welcome | Ẹ káàlẹ́=Good evening
E ṣeun/E ṣé=Thank you | Jọ̀ọ́/E jọ̀=Please | Bẹ́ẹ̀ni=Yes | Bẹ́ẹ̀kọ́=No
Bawo ni?=How are you? | Mo wà dáadáa=I am fine | O dàbọ̀=Goodbye
Kí ni?=What? | Níbo ni?=Where? | Tani?=Who? | Mo fẹ́=I want

## IGBO VOCABULARY — correct special characters
Nnọọ/Nno=Welcome | Kedu/Kedụ=How are you? | Ọ dị mma=I am fine/It is fine
Ututu ọma=Good morning | Ehihie ọma=Good afternoon | Anyasị ọma=Good evening
Daalụ=Thank you | Biko=Please | Ee=Yes | Mba=No | Gịnị=What? | Ebee?=Where?
Aha m bụ...=My name is... | A ghọtara m=I understand | A ghọtaghị m=I don't understand

## HAUSA VOCABULARY — correct forms
Sannu=Hello | Barka da safe=Good morning | Barka da rana=Good afternoon
Na gode=Thank you | Don Allah=Please | Ee/Iya=Yes | A'a=No
Lafiya lau=I am fine | Yaya lafiya?=How is your health? | Sai anjima=Goodbye
Sunana...=My name is... | Na gane=I understand | Ban gane ba=I don't understand

## NIGERIAN PIDGIN VOCABULARY
wetin=what | dey=is/are/doing | abeg=please | na=it is/that is | oya=okay/let's go
sabi=know | wahala=trouble | how far=hello | no wahala=no problem | e don be=it's done
chop=eat | pikin=child | oga=boss | una=you all | dem=they | nau=now | sharp sharp=quickly
I no fit=I cannot | make=let/allow | abi=right? | e dey=it is | waka=go

## DEFAULT GREETING (first message in Pidgin)
"How far! I be 9JAI, your Naija super AI. Wetin I fit do for you today? 🇳🇬"

## CAPABILITIES
Chat, translate, explain, code, generate images/videos, mathematics, science, law, medicine, finance, history, all Nigerian languages, engineering, business.

## RULES
1. RESPOND ONLY IN THE USER'S LANGUAGE — most important rule
2. Be direct and concise — answer exactly what was asked
3. For image/video requests: say "Generating now! 🎨" — the app handles it automatically
4. For code: write complete, working code with comments
5. Be warm, intelligent, and proud of Nigerian/African culture
`;

// ── Whisper transcription (via proxy) ─────────────────────────────────────

export async function transcribeWithWhisper(audioBlob: Blob): Promise<string> {
  try {
    const { proxyTranscribe } = await import('./aiProxy');
    const { getConversationLanguage } = await import('./language');
    const lang = getConversationLanguage() ?? '';
    const text = await proxyTranscribe(audioBlob, lang);
    if (text) return text;
  } catch (err) {
    console.warn('[ai.ts] Proxy transcribe failed:', err);
  }

  // Direct Groq fallback (dev only)
  try {
    const key = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env?.VITE_GROQ_KEY;
    if (!key) return '';

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');
    formData.append('temperature', '0');

    const res = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: formData,
    });

    if (!res.ok) return '';
    const data = await res.json();
    return (data.text ?? '').trim();
  } catch {
    return '';
  }
}

// ── URL content fetcher ────────────────────────────────────────────────────

export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const { proxySearch } = await import('./aiProxy');
    const result = await proxySearch(url);
    return result.context.slice(0, 8000);
  } catch {
    return '';
  }
}

// ── Chat attachment type ───────────────────────────────────────────────────

export interface ChatAttachment {
  type: 'image' | 'audio' | 'url';
  name: string;
  data: string;
  mimeType?: string;
}

// ── EdoChat session ────────────────────────────────────────────────────────

export interface EdoChat {
  sendMessage: (opts: {
    message: string;
    attachments?: ChatAttachment[];
    vocabContext?: string;
    assistantId?: string;
  }) => Promise<{ text: string }>;
  sendMessageStream: (opts: {
    message: string;
    attachments?: ChatAttachment[];
    vocabContext?: string;
    assistantId?: string;
  }) => AsyncGenerator<string>;
}

export function getEdoChat(_defaultAssistantId: string = 'nosa'): EdoChat {
  const history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: EDO_SYSTEM_INSTRUCTION },
  ];

  return {
    async sendMessage({ message, attachments = [], vocabContext, assistantId: _assistantId }) {
      let userContent = message;
      if (vocabContext) userContent = `[Vocab DB]:\n${vocabContext}\n\nUser: ${message}`;
      if (attachments.length > 0) {
        const desc = attachments.map(a =>
          a.type === 'image' ? `[Image: ${a.name}]` : `[Audio: ${a.name}]`
        ).join('\n');
        userContent += `\n\n${desc}`;
      }
      history.push({ role: 'user', content: userContent });
      let reply = '';
      for await (const chunk of unifiedChatStream(history, 0.7)) reply += chunk;
      history.push({ role: 'assistant', content: reply });
      return { text: reply };
    },

    async *sendMessageStream({ message, attachments = [], vocabContext, assistantId: _assistantId }) {
      let userContent = message;
      if (vocabContext) userContent = `[Vocab DB]:\n${vocabContext}\n\nUser: ${message}`;
      if (attachments.length > 0) {
        const desc = attachments.map(a =>
          a.type === 'image' ? `[Image: ${a.name}]` : `[Audio: ${a.name}]`
        ).join('\n');
        userContent += `\n\n${desc}`;
      }
      history.push({ role: 'user', content: userContent });
      let fullReply = '';
      for await (const chunk of unifiedChatStream(history, 0.7)) {
        fullReply += chunk;
        yield chunk;
      }
      history.push({ role: 'assistant', content: fullReply });
    },
  };
}

// ── Stubs (kept for import compatibility) ─────────────────────────────────

export async function generateEdoAudio(_text: string): Promise<string | null> {
  return null;
}

export async function transcribeEdoAudio(
  _audioBase64: string,
  _mimeType: string
): Promise<{ word: string; phonetic: string }> {
  return { word: '', phonetic: '' };
}
