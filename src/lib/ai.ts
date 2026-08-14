/**
 * 9JAI local-first chat engine.
 * External providers are optional accelerators behind the proxy, not the app brain.
 */

import { proxyChat as _proxyChat, proxyImage } from './aiProxy';
import { getLocalFallbackResponse } from './fallbackResponses';
import { knowledgeEngine } from './platform/knowledgeEngine';
import { trackChatRequest } from './platform/analytics';
import { recoveryService, QueuedRequest } from './platform/recoveryService';
import { hasBrowserCapability } from './inHouseEngine';
import { getEngineRouteOrder, sanitizeUserFacingText } from './providerAdapter';

export interface ChatMessageLike {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MAX_CONTEXT_CHARS = 12000;
const MAX_HISTORY_MESSAGES = 16;

function getCurrentConversationLanguage(): string {
  try {
    const stored = localStorage.getItem('conversation_language');
    if (stored) return stored;
  } catch {
    // ignore localStorage access issues and fall back to default
  }
  return 'pcm';
}

function buildBoundedContext(messages: ChatMessageLike[]): ChatMessageLike[] {
  const system = messages.find((message) => message.role === 'system');
  const nonSystem = messages.filter((message) => message.role !== 'system');
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

async function* wordStream(text: string): AsyncGenerator<string> {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
    yield chunk;
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
}

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

export async function* unifiedChatStream(messages: ChatMessageLike[], temperature = 0.7): AsyncGenerator<string> {
  const startTime = Date.now();

  try {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const conversationLanguage = getCurrentConversationLanguage();
    let knowledgeContext = '';

    if (lastUserMessage) {
      try {
        const knowledgeResults = await knowledgeEngine.search(lastUserMessage.content, {
          topK: 3,
          minSimilarity: 0.6,
        });

        if (knowledgeResults.length > 0) {
          knowledgeContext = '\n\n[Relevant Knowledge]:\n' + knowledgeResults
            .slice(0, 3)
            .map((result) => `- ${result.entry.content.slice(0, 600)} (${result.entry.metadata.language})`)
            .join('\n')
            .slice(0, 2200);
        }
      } catch (err) {
        console.warn('[AI] Knowledge search failed:', err);
      }
    }

    const enrichedMessages = knowledgeContext
      ? [...messages.slice(0, -1), {
          role: 'user' as const,
          content: messages[messages.length - 1].content.slice(0, 4000) + knowledgeContext,
        }]
      : messages;

    const boundedMessages = buildBoundedContext(enrichedMessages);

    // Detect whether a visual explanation/diagram would materially improve this response
    function visualExplanationRequired(text?: string): boolean {
      if (!text) return false;
      const t = text.toLowerCase();
      const visualKeywords = ['explain','teach','demonstrate','show','illustrate','visualize','diagram','how','how does','how to','process','structure','anatomy','geometry','math','mathematics','physics','chemistry','biology','engine','mechanism','cycle','flow','water cycle','photosynthesis','heart','diagram','draw','sketch','chart','graph','plot','example','step by step','step-by-step','show me how'];
      return visualKeywords.some(k => t.includes(k));
    }

    // If visual explanation is needed, attempt to generate a diagram/image first and attach it to the chat context
    let messagesForChat = boundedMessages;
    try {
      const lastUserText = lastUserMessage?.content;
      if (visualExplanationRequired(lastUserText)) {
        const visualPrompt = `Create a clear labeled diagram or educational visual for: ${lastUserText}. Include labels for major parts and a concise caption describing each part.`;
        const img = await proxyImage(visualPrompt);
        if (img && img.imageUrl) {
          // Append a short user-level attachment note so the chat model can reference the image
          messagesForChat = [
            ...boundedMessages,
            // Attach the generated image as an assistant message so the chat model treats it as available context
            { role: 'assistant' as const, content: `__IMAGE__${img.imageUrl}` },
            { role: 'system' as const, content: `An educational diagram was generated and attached. The assistant should reference and explain the diagram, label important parts, and include step-by-step explanations where appropriate.` },
          ];
        }
      }
    } catch (err) {
      console.warn('[AI] Visual generation attempt failed:', err);
      // Continue without image — fallback to text-only explanation
    }

    const result = await _proxyChat({ messages: messagesForChat, temperature, maxTokens: 1024 });
    const latency = Date.now() - startTime;

    if (result.text) {
      recoveryService.recordSuccess(result.provider, latency, 0.8, 'chat');
      recoveryService.evaluateOfflineMode('chat');
      trackChatRequest(result.provider, true, latency);

      if (lastUserMessage && result.text.length < 500) {
        try {
          await knowledgeEngine.addEntry(
            `Q: ${lastUserMessage.content}\nA: ${result.text.slice(0, 200)}`,
            {
              type: 'conversation',
              language: conversationLanguage,
              confidence: 0.7,
              timestamp: Date.now(),
            }
          );
        } catch (err) {
          console.warn('[AI] Failed to save to knowledge engine:', err);
        }
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

    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const queuedRequest: QueuedRequest = {
      id: `chat-${Date.now()}`,
      messages,
      capability: 'chat',
      createdAt: Date.now(),
    };
    recoveryService.enqueueRequest(queuedRequest);
    recoveryService.evaluateOfflineMode('chat');

    const routeOrder = getEngineRouteOrder('chat');
    const browserReady = hasBrowserCapability('chat');
    const availableLocal = routeOrder.includes('local') || routeOrder.includes('browser') || browserReady;
    const languageCode = getCurrentConversationLanguage();
    const fallbackText = availableLocal
      ? getLocalFallbackResponse(lastUserMessage?.content ?? 'How can I help?', languageCode)
      : 'I am in local fallback mode and can still help while connectivity is restored.';

    yield* wordStream(sanitizeUserFacingText(fallbackText));
    return;
  }
}

export async function discoverLanguage(nameOrRegion: string, location: string, isRegional = false) {
  const prompt = isRegional
    ? `Research the major indigenous languages in ${nameOrRegion} in ${location}. Provide brief details and sample phrases.`
    : `Research ${nameOrRegion} language in ${location}. Provide a short dictionary, key phrases, and a cultural overview.`;

  let text = '';
  for await (const chunk of unifiedChatStream([{ role: 'user', content: prompt }], 0.5)) {
    text += chunk;
  }

  return { text, sources: [] };
}

export async function translateAndSpeak(text: string, language: string): Promise<string> {
  let result = '';
  for await (const chunk of unifiedChatStream([{ role: 'user', content: `Translate to ${language}: "${text}".` }])) {
    result += chunk;
  }
  return result || getLocalFallbackResponse(text, language.slice(0, 2));
}

export const EDO_SYSTEM_INSTRUCTION = `You are 9JAI — a local-first African AI assistant. Respond in the user\'s language and keep replies short, clear, and useful.`;

export type ChatAttachment = {
  id?: string;
  type: 'image' | 'audio' | 'file' | 'url';
  name?: string;
  dataUrl?: string;
  data?: string;
  mimeType?: string;
  url?: string;
};

export async function generateEdoAudio(_text: string): Promise<string> {
  return '';
}

export function getEdoChat() {
  return {
    async *sendMessageStream({ message, attachments }: { message: string; attachments?: ChatAttachment[]; vocabContext?: string }) {
      const prompt = attachments?.length ? `${message}\nAttachments: ${attachments.map((a) => a.url || a.dataUrl || a.name || 'file').join(', ')}` : message;
      for await (const chunk of unifiedChatStream([{ role: 'user', content: prompt }])) {
        yield chunk;
      }
    },
  };
}

export function transcribeWithWhisper(_input: string | File | Blob): string {
  return 'Transcript unavailable locally.';
}

export function transcribeEdoAudio(_audio: Blob | string): string {
  return 'Audio transcription unavailable locally.';
}
