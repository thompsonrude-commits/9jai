import { AIOrchestrator } from '../../9ja-ai/9ja-ai-core/orchestrator/AIOrchestrator.ts';
import { ConsoleLogger } from '../../9ja-ai/9ja-ai-core/logging/Logger.ts';
import { LanguageEngineAdapter } from '../../9ja-ai/9ja-ai-core/engines/language/LanguageEngine.ts';
import type { AIRequest } from '../../9ja-ai/9ja-ai-core/types.ts';
import type { ProxyChatMessage } from './aiProxy';

export interface OrchestratedChatResult {
  text: string;
  provider: 'orchestrator';
  metadata?: Record<string, unknown>;
}

let orchestrator: AIOrchestrator | null = null;

function getOrchestrator(): AIOrchestrator {
  if (!orchestrator) {
    const languageEngine = new LanguageEngineAdapter();

    orchestrator = new AIOrchestrator({
      logger: new ConsoleLogger(),
      engines: {
        language: {
          kind: 'language',
          execute: async (request: AIRequest) => {
            const payload = (request.payload ?? {}) as Record<string, unknown>;
            switch (request.operation) {
              case 'reason':
                return languageEngine.reason(payload);
              case 'code':
                return languageEngine.code(payload);
              case 'summarize':
                return languageEngine.summarize(payload);
              case 'write':
                return languageEngine.write(payload);
              default:
                return languageEngine.chat(payload);
            }
          },
        },
      },
    });
  }

  return orchestrator;
}

export function buildOrchestratorRequest(messages: ProxyChatMessage[], temperature = 0.7): AIRequest {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const prompt = lastUserMessage?.content ?? '';

  return {
    id: `orchestrator-${Date.now()}`,
    source: 'android-app',
    kind: 'language',
    operation: 'chat',
    payload: {
      prompt,
      context: {
        messages,
        temperature,
      },
    },
    metadata: {
      temperature,
      source: 'android-app',
    },
  };
}

export async function getOrchestratedChatResponse(messages: ProxyChatMessage[], temperature = 0.7): Promise<OrchestratedChatResult | null> {
  try {
    const request = buildOrchestratorRequest(messages, temperature);
    const response = await getOrchestrator().handleRequest(request);
    const data = response.data as { output?: string } | undefined;
    const text = typeof data?.output === 'string' ? data.output : '';

    if (!text) {
      return null;
    }

    return {
      text,
      provider: 'orchestrator',
      metadata: response.metadata,
    };
  } catch (error) {
    console.warn('[AIOrchestratorBridge] orchestrated chat failed:', error);
    return null;
  }
}
