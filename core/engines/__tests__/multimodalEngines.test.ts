import { describe, expect, it } from 'vitest';
import { DefaultSpeechEngine } from '../speech/SpeechEngine';
import { DefaultTranslationEngine } from '../translation/TranslationEngine';
import { DefaultOcrEngine } from '../ocr/OCREngine';

describe('multimodal engines', () => {
  it('translates text into the requested target language', async () => {
    const engine = new DefaultTranslationEngine();
    const result = await engine.translate('Hello world', 'yo');

    expect(result.translatedText).toContain('yo');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('synthesizes and transcribes audio text', async () => {
    const engine = new DefaultSpeechEngine();
    const audio = await engine.synthesize('Ẹ káàbọ̀');
    const transcript = await engine.transcribe(Buffer.from('Ẹ káàbọ̀'));

    expect(audio.mimeType).toContain('audio');
    expect(transcript.text).toContain('Ẹ');
  });

  it('extracts text and structured content from OCR input', async () => {
    const engine = new DefaultOcrEngine();
    const result = await engine.extractText('Hello Edo');

    expect(result.fullText).toContain('Hello');
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(engine.supportedLanguages()).toContain('en');
  });
});
