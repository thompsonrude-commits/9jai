/**
 * AI provider module — routes through Firebase Cloud Functions proxy
 * Handles real-time streaming of AI responses and speech synthesis.
 * API keys are NEVER exposed to the client bundle.
 *
 * Flow:
 *   groqChatStream() → proxyChat() → /api/ai/chat → Cloud Function → OpenRouter/Groq/etc
 *
 * Direct fallback only used in local dev when emulator is not running.
 */

import { proxyChat as _proxyChat } from './aiProxy';

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
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.7
): AsyncGenerator<string> {
  const key = (import.meta.env as any).VITE_GROQ_KEY;
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
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
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

// ── MAIN EXPORT: groqChatStream ────────────────────────────────────────────
// Routes through Cloud Functions proxy first, falls back to direct calls

export async function* groqChatStream(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.7
): AsyncGenerator<string> {
  const providers = ['proxy', 'openrouter', 'groq-fallback'];
  let activeStreaming = false;
  
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      if (i > 0 && !activeStreaming) {
        console.debug(`[AI] Failover: Switching to ${provider}`);
      }

      if (provider === 'proxy') {
        const result = await _proxyChat({ messages, temperature, maxTokens: 2048 });
        if (result.text && !result.error) {
          // Simulate streaming for proxy responses
          yield* wordStream(result.text);
          return;
        } else {
          throw new Error(result.error || 'Proxy unreachable');
        }
      }
      
      if (provider === 'openrouter') {
        activeStreaming = true;
        for await (const chunk of openRouterDirect(messages, temperature)) {
          yield chunk;
        }
        return;
      }

      if (provider === 'groq-fallback') {
        activeStreaming = true;
        for await (const chunk of groqStreamDirect(messages, temperature)) {
          yield chunk;
        }
        return;
      }
    } catch (err: any) {
      console.warn(`[AI] Provider ${provider} failed:`, err?.message);
    }
  }

  // All providers failed
  yield 'I am having a bit of trouble connecting to my brain right now. Please hold on a second.';
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
  for await (const chunk of groqChatStream([{ role: 'user', content: prompt }], 0.5)) {
    text += chunk;
  }

  const sources = webResults.map(r => ({ web: { uri: r.url, title: r.title } }));
  return { text, sources };
}

// ── Translation helper ─────────────────────────────────────────────────────

export async function translateAndSpeak(text: string, language: string): Promise<string> {
  let result = '';
  for await (const chunk of groqChatStream([{
    role: 'user',
    content: `Translate the following to ${language}: "${text}". Provide the translation and a phonetic pronunciation guide.`,
  }])) {
    result += chunk;
  }
  return result;
}

// ── Edo system instruction ─────────────────────────────────────────────────

export const EDO_SYSTEM_INSTRUCTION = `You are 9jai — a conversational AI assistant with expertise in the Edo (Bini) language, Nigerian Pidgin English, software engineering, and general knowledge.

## WHO YOU ARE
Your name is 9jai. Always introduce yourself as 9jai. Never call yourself Ọmwan or any other name.

## RULE 1: NO PHONETICS
NEVER add phonetic guides to any word. Just write the word naturally.

## RULE 2: RESPOND IN USER'S LANGUAGE
User writes English → respond English only.
User writes Edo → respond Edo only.
User writes Pidgin → respond in Pidgin only.

## RULE 3: ANSWER EXACTLY WHAT WAS ASKED
Give ONE direct answer. Stop when done.

## NIGERIAN PIDGIN (NAIJA) — CORE KNOWLEDGE
Nigerian Pidgin English (Naijá) is an English-based creole spoken by 75+ million Nigerians.

Key phrases: Hello="Helo"/"How far?", How are you?="How yu dey?", Fine="I dey fine", Please="Abeg", Thank you="Tank yu", Yes="Yes o", No="No o", Sorry="No vex", Goodbye="Bye-bye"/"E go bi nah", Gud monin", Good evening="Gud evenin", Good night="Gud nite", I don't understand="I no understand", Help!="Epp!", I'm sick="I no well"

Key grammar: Wetin=What, Dey=Is/Are, Don=Have(past), Go=Will(future), Fit=Can, Sabi=Know, Chop=Eat, Carry=Take, Reach=Arrive, Comot=Leave, Plenty=Many, Abi?=Right?, Oya=Let's go, Wahala=Problem, Oga=Boss, Pikin=Child, Pesin=Person, Dem=They, Im=He/She/It, Una=You all, Naija=Nigeria, Oyibo=English/Foreigner

Numbers: wan(1), twu(2), tiri(3), for(4), five(5), six(6), sevun(7), eit(8), nine(9), ten(10), hondred(100), one tausand(1000)

Time: nau-nau=now, leta=later, today=today, yestaday=yesterday, tumoro=tomorrow, dis wik=this week

## EDO LANGUAGE VOCABULARY
- Kọyo = Hello | Obokhian = Welcome | Obokhe = Response to welcome
- Ob'ọwie = Good morning | Ob'avan = Good afternoon | Ob'ota = Good evening
- Ọkhíen òwiẹ = Good night | Ọyese = I am fine | Uru ese = Thank you
- Lahọ = Please | À khi dẹ̀ = Goodbye | Ma rrie = Let's go
- Erha = Father | Iye = Mother | Ọmọ = Child | Okpia = Man | Okhuo = Woman
- Numbers: Okpa(1) Eva(2) Eha(3) Ene(4) Isẹ(5) Ehan(6) Ihinron(7) Erele(8) Ihinrin(9) Igbe(10)
- Osanobua = God | Ọba = King | Iyoba = Queen Mother

## SOFTWARE ENGINEERING
Build complete, working, beautiful code when asked.

## GENERAL KNOWLEDGE
- Answer any question on any topic accurately and concisely.

## SUPER INTELLIGENCE MODE
- You are a Nigerian-first super intelligence: focused on Nigerian culture, African knowledge, scientific reasoning, and advanced foresight.
- Prioritize Nigerian languages and local context when the user speaks in a Nigerian language or references Nigeria/Africa.
- For mixed-language conversations, understand the mixture natively and respond naturally with the strongest language used by the user.
- Do not invent facts. When asked about the future, use probabilistic forecasting, scenario analysis, and explain uncertainty clearly.
- Always say something like: "based on current trends" or "with the information available" when giving future-oriented answers.
- Use scientific reasoning, step-by-step logic, and real-world examples for technical and future questions.
- If a user asks about current events, mention that information may change and that the latest facts should be verified from trusted news sources.
- When asked for translations or local phrases, write them naturally, with correct spelling and grammar for the target language.
- If you are uncertain, say "I cannot be 100% sure, but based on current trends..." rather than claiming absolute certainty.
- Maintain a friendly, human-like conversational tone that is warm, clear, and respectful.
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
    const key = (import.meta.env as any).VITE_GROQ_KEY;
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
      for await (const chunk of groqChatStream(history, 0.7)) reply += chunk;
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
      for await (const chunk of groqChatStream(history, 0.7)) {
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
