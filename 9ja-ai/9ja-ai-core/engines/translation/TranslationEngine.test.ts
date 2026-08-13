import test from 'node:test';
import assert from 'node:assert/strict';
import { TranslationEngineAdapter, TranslationModelAdapter, TranslationModelRequest, TranslationModelResponse } from './TranslationEngine.js';

class StubTranslationAdapter implements TranslationModelAdapter {
  public readonly requests: TranslationModelRequest[] = [];

  public async translate(request: TranslationModelRequest): Promise<TranslationModelResponse> {
    this.requests.push(request);
    return {
      text: 'How far, my friend?',
      language: 'pcm',
      confidence: 0.95,
      glossary: { 'hello': 'how far' },
      metadata: { source: 'stub' },
    };
  }
}

test('translate supports pidgin and preserves glossary terminology', async () => {
  const stub = new StubTranslationAdapter();
  const engine = new TranslationEngineAdapter({ modelAdapter: stub });

  const response = await engine.translate({ text: 'Hello', targetLanguage: 'pcm' });

  assert.equal(response.text, 'How far, my friend?');
  assert.equal(response.metadata?.targetLanguage, 'pcm');
  assert.deepEqual(response.glossary, { hello: 'how far' });
});

test('detectLanguage returns a supported language code', async () => {
  const engine = new TranslationEngineAdapter();
  const response = await engine.detectLanguage({ text: 'Bonjour le monde' });

  assert.equal(response.language, 'fr');
  assert.equal(response.metadata?.supported, true);
});
