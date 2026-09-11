import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getConversationLanguageContext,
  normalizeLanguageCode,
  resetLanguageContext,
  setConversationLanguageContext,
} from '../homepageLanguageRouter';

const createLocalStorageMock = () => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
};

describe('homepageLanguageRouter', () => {
  beforeEach(() => {
    const mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    mockStorage.clear();
    resetLanguageContext();
  });

  it('restores the saved conversation language on startup', () => {
    const mockStorage = globalThis.localStorage as any;
    mockStorage.setItem('conversation_language', 'edo');
    const next = getConversationLanguageContext();
    expect(next).toBe('edo');
  });

  it('keeps the selected language in sync with the persisted context', () => {
    setConversationLanguageContext('yo');
    expect(getConversationLanguageContext()).toBe('yo');
    expect(globalThis.localStorage.getItem('conversation_language')).toBe('yo');
  });

  it('normalizes aliases and invalid values back to supported language codes', () => {
    expect(normalizeLanguageCode('Nigerian Pidgin')).toBe('pcm');
    expect(normalizeLanguageCode('English')).toBe('en');
    expect(normalizeLanguageCode('Edo Language')).toBe('edo');
    expect(normalizeLanguageCode('totally-unknown')).toBe('pcm');
  });
});
