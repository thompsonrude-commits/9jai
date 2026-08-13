import { ConversationState, LanguageRequest } from './types';

export type PromptTemplate = (context: {
  request: LanguageRequest;
  conversation?: ConversationState;
  systemInstructions?: string;
  safetyPolicy?: string;
  knowledgeSnippets?: string[];
}) => string;

export class PromptBuilder {
  constructor(private template: PromptTemplate) {}

  build(opts: {
    request: LanguageRequest;
    conversation?: ConversationState;
    systemInstructions?: string;
    safetyPolicy?: string;
    knowledgeSnippets?: string[];
  }) {
    return this.template(opts);
  }
}

export const defaultTemplate: PromptTemplate = ({ request, conversation, systemInstructions, safetyPolicy, knowledgeSnippets }) => {
  const conv = conversation?.turns.map(t => `${t.role}: ${t.content}`).join('\n') || '';
  const kb = (knowledgeSnippets || []).join('\n---\n');
  return [
    systemInstructions || 'You are a helpful assistant.',
    safetyPolicy || '',
    'Context:',
    conv,
    kb ? `Knowledge:\n${kb}` : '',
    'User:',
    request.input,
    '\nRespond concisely.'
  ].filter(Boolean).join('\n\n');
};

export const defaultPromptBuilder = new PromptBuilder(defaultTemplate);
