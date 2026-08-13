import { describe, expect, it } from 'vitest';
import { normalizeChatMessages, normalizeChatMessagesForProvider } from './providerPayload';

describe('providerPayload utilities', () => {
  it('normalizes chat messages and preserves valid roles', () => {
    const messages = [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];

    const normalized = normalizeChatMessages(messages, 'openrouter');

    expect(normalized).toEqual([
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);
  });

  it('drops invalid entries and coerces unknown roles to user', () => {
    const messages = [
      { role: 'unknown', content: 'Message' },
      { role: 'user', content: undefined as unknown as string },
      { role: 'assistant', content: 'Valid assistant message' },
    ];

    const normalized = normalizeChatMessagesForProvider(messages as any, 'huggingface');

    expect(normalized).toEqual([
      { role: 'user', content: 'Message' },
      { role: 'assistant', content: 'Valid assistant message' },
    ]);
  });
});
