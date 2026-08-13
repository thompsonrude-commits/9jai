import { describe, it, expect } from 'vitest';
import { DefaultLanguageEngine } from '../LanguageEngine';

describe('DefaultLanguageEngine', () => {
  it('detects African language text with high confidence', async () => {
    const engine = new DefaultLanguageEngine();
    const result = await engine.detectLanguage('Ẹkáàbọ̀, mo wa');

    expect(result.detectedLanguage).toBe('edo');
    expect(result.isAfricanLanguage).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('generates a response in the requested language', async () => {
    const engine = new DefaultLanguageEngine();
    const response = await engine.generate('How are you?', 'yor');

    expect(response).toContain('yoruba');
  });
});
