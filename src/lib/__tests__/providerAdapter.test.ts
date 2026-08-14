import { describe, expect, it } from 'vitest';
import { buildLocalCapabilityMessage, getEngineRouteOrder, isBlockedProviderEndpoint, sanitizeUserFacingText } from '../providerAdapter';
import { getInHouseReply } from '../inHouseEngine';

describe('providerAdapter', () => {
  it('blocks unsafe local endpoints from application routing', () => {
    expect(isBlockedProviderEndpoint('http://localhost:3000')).toBe(true);
    expect(isBlockedProviderEndpoint('https://api.groq.com/openai/v1/chat/completions')).toBe(false);
  });

  it('sanitizes internal reasoning and secret metadata before user display', () => {
    const sanitized = sanitizeUserFacingText('<think>secret token abc</think> Authorization: Bearer abc123');
    expect(sanitized).not.toContain('abc123');
    expect(sanitized).not.toContain('<think>');
    expect(sanitized).toContain('redacted');
  });

  it('prefers local/browser routing before external providers for weather and time', () => {
    expect(getEngineRouteOrder('weather')[0]).toBe('browser');
    expect(getEngineRouteOrder('time')[0]).toBe('browser');
    expect(getEngineRouteOrder('chat')[0]).toBe('local');
  });

  it('returns a local fallback for chat and weather capability requests', () => {
    const chatReply = getInHouseReply('chat', 'How you dey?');
    const weatherReply = getInHouseReply('weather', 'What is the weather here?');
    expect(chatReply.text).toContain('9JA AI');
    expect(weatherReply.text).toContain('live weather');
    expect(buildLocalCapabilityMessage('weather', 'What is the weather here?')).toContain('live weather');
  });
});
