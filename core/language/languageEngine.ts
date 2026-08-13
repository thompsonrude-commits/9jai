import { LanguageRequest, LanguageResponse } from './types';
import { defaultConversationManager, ConversationManager } from './conversationManager';
import { PromptBuilder, defaultPromptBuilder } from './promptBuilder';
import { ResponseGenerator, defaultResponseGenerator } from './responseGenerator';
import { ReasoningManager, defaultReasoningManager } from './reasoningManager';
import { LanguageEngineAdapters, noopKnowledgeAdapter, noopMemoryAdapter, noopToolInvoker } from './adapters';

export interface LanguageEngineOptions {
  conversationManager?: ConversationManager;
  promptBuilder?: PromptBuilder;
  responseGenerator?: ResponseGenerator;
  reasoningManager?: ReasoningManager;
  adapters?: LanguageEngineAdapters;
}

export class LanguageEngine {
  conversationManager: ConversationManager;
  promptBuilder: PromptBuilder;
  responseGenerator: ResponseGenerator;
  reasoningManager: ReasoningManager;
  adapters: LanguageEngineAdapters;

  constructor(opts?: LanguageEngineOptions) {
    this.conversationManager = opts?.conversationManager || defaultConversationManager;
    this.promptBuilder = opts?.promptBuilder || defaultPromptBuilder;
    this.responseGenerator = opts?.responseGenerator || defaultResponseGenerator;
    this.reasoningManager = opts?.reasoningManager || defaultReasoningManager;
    this.adapters = { memory: noopMemoryAdapter, knowledge: noopKnowledgeAdapter, tools: noopToolInvoker, ...(opts?.adapters || {}) };
  }

  async handleRequest(req: LanguageRequest): Promise<LanguageResponse> {
    const sessionId = req.sessionId || `anon-${Date.now()}`;
    // record turn
    this.conversationManager.addTurn(sessionId, { role: 'user', content: req.input });

    // retrieve memory + knowledge
    const memories = await this.adapters.memory?.retrieveRelevant(req, 5) || [];
    const knowledge = await this.adapters.knowledge?.retrieve(req.input, 3) || [];
    const knowledgeSnippets = knowledge.map(k => `${k.text} (source: ${k.source || 'unknown'})`);

    const prompt = this.promptBuilder.build({ request: req, conversation: this.conversationManager.getState(sessionId), knowledgeSnippets, systemInstructions: req.options?.systemInstructions, safetyPolicy: req.options?.safetyPolicy });

    // naive reasoning use
    const steps = this.reasoningManager.decomposeTask(req.input);

    // generate a deterministic response for now (no model integration)
    const answerText = `Echo: ${req.input}\n\nSteps:\n${steps.map((s, i) => `${i+1}. ${s}`).join('\n')}`;

    const resp = this.responseGenerator.formatText(answerText);

    // record assistant turn
    this.conversationManager.addTurn(sessionId, { role: 'assistant', content: resp.text });

    // include simple confidence and citations
    resp.confidence = 0.8;
    resp.citations = knowledge.map(k => ({ source: k.source || 'unknown', score: k.score || 0 }));

    return resp;
  }
}

export const defaultLanguageEngine = new LanguageEngine();
