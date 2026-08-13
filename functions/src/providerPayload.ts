export interface ProviderPayloadMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function normalizeChatMessagesForProvider(
  messages: Array<ProviderPayloadMessage | { role: string; content: string }>,
  _provider: string
): ProviderPayloadMessage[] {
  return messages
    .filter((message) => message && typeof message.content === 'string')
    .map((message) => ({
      role: (message.role === 'assistant' || message.role === 'system' || message.role === 'user')
        ? message.role
        : 'user',
      content: String(message.content).trim(),
    }));
}

export function normalizeChatMessages(
  messages: Array<ProviderPayloadMessage | { role: string; content: string }>,
  provider: string
): ProviderPayloadMessage[] {
  return normalizeChatMessagesForProvider(messages, provider);
}
