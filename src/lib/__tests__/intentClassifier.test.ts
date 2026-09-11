import { describe, expect, it } from 'vitest';
import { classifyUserIntent } from '../providerAdapter';

describe('intentClassifier', () => {
  it('detects image generation requests', () => {
    const result = classifyUserIntent('Generate an image of Benin City at sunset');
    expect(result.capability).toBe('image');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('detects translation and target language', () => {
    const result = classifyUserIntent('Translate this into Edo');
    expect(result.capability).toBe('language');
    expect(result.targetLanguage).toBe('edo');
  });

  it('detects search and research requests', () => {
    const result = classifyUserIntent('Search the web for the latest information on African AI');
    expect(result.capability).toBe('search');
  });

  it('detects document and spreadsheet tasks', () => {
    const result = classifyUserIntent('Clean this spreadsheet and summarize the totals');
    expect(result.capability).toBe('document');
  });

  it('detects music and voice requests', () => {
    const music = classifyUserIntent('Compose an Afrobeats song about Lagos');
    const voice = classifyUserIntent('Read this aloud in a calm voice');
    expect(music.capability).toBe('music');
    expect(voice.capability).toBe('tts');
  });

  it('keeps a multi-intent request stable while reporting secondary capabilities', () => {
    const result = classifyUserIntent('Search the web and generate an image of Lagos at night');
    expect(result.capability).toBe('image');
    expect(result.secondaryCapabilities).toContain('search');
  });

  it('preserves a targeted language request when combined with another task', () => {
    const result = classifyUserIntent('Translate this into Edo and summarize it');
    expect(result.capability).toBe('language');
    expect(result.targetLanguage).toBe('edo');
  });
});
