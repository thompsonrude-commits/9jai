import { describe, it, expect } from 'vitest';
import { createAIService } from '../AIService';
import { DEFAULT_AI_CONFIG } from '../../config/AIConfig';

describe('createAIService', () => {
  it('initializes and processes a chat request', async () => {
    const service = createAIService();
    await service.initialize({ ...DEFAULT_AI_CONFIG, environment: 'development', providers: {} } as any);
    const response = await service.process({ type: 'chat', prompt: 'Hello', userId: 'u1' } as any);

    expect(response.type).toBe('chat');
    expect(response.text).toContain('Hello');
  });
});
