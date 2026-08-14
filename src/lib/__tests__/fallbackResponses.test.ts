import { describe, expect, it } from 'vitest';
import { detectFallbackLanguageCode, getLocalFallbackResponse } from '../fallbackResponses';

describe('fallbackResponses', () => {
  it('detects Nigerian Pidgin input', () => {
    expect(detectFallbackLanguageCode('How you dey?')).toBe('pcm');
  });

  it('detects Yoruba input', () => {
    expect(detectFallbackLanguageCode('Bawo ni?')).toBe('yo');
  });

  it('detects Igbo input', () => {
    expect(detectFallbackLanguageCode('Kedu?')).toBe('ig');
  });

  it('detects Hausa input', () => {
    expect(detectFallbackLanguageCode('Sannu')).toBe('ha');
  });

  it('detects Edo input', () => {
    expect(detectFallbackLanguageCode('Kọyọ')).toBe('edo');
  });

  it('detects Esan input', () => {
    expect(detectFallbackLanguageCode('Vbẹe oye hẹ?')).toBe('esan');
  });

  it('returns language-aware fallback text', () => {
    expect(getLocalFallbackResponse('How you dey?', 'pcm')).toContain('9JA AI');
    expect(getLocalFallbackResponse('Bawo ni?', 'yo')).toContain('9JA AI');
    expect(getLocalFallbackResponse('Kedu?', 'ig')).toContain('9JA AI');
    expect(getLocalFallbackResponse('Sannu', 'ha')).toContain('9JA AI');
    expect(getLocalFallbackResponse('Kọyọ', 'edo')).toContain('9JA AI');
    expect(getLocalFallbackResponse('Vbẹe oye hẹ?', 'esan')).toContain('9JA AI');
  });
});
