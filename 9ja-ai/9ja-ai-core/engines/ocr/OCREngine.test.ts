import test from 'node:test';
import assert from 'node:assert/strict';
import { OCREngineAdapter, OCRModelAdapter, OCRModelRequest, OCRModelResponse } from './OCREngine.js';

class StubOCRAdapter implements OCRModelAdapter {
  public readonly requests: OCRModelRequest[] = [];

  public async extract(request: OCRModelRequest): Promise<OCRModelResponse> {
    this.requests.push(request);
    return {
      text: 'Hello world',
      language: 'en',
      structured: {
        blocks: [
          { type: 'paragraph', text: 'Hello world' },
        ],
      },
      confidence: 0.94,
      metadata: { source: 'stub' },
    };
  }
}

test('extractPrintedText returns structured OCR output', async () => {
  const stub = new StubOCRAdapter();
  const engine = new OCREngineAdapter({ modelAdapter: stub });

  const response = await engine.extractPrintedText({ image: 'img', language: 'en' });

  assert.equal(response.text, 'Hello world');
  assert.equal(response.language, 'en');
  assert.equal(response.structured?.blocks[0].type, 'paragraph');
  assert.equal(response.confidence, 0.94);
});

test('parseReceipt includes a normalized receipt structure', async () => {
  const stub = new StubOCRAdapter();
  const engine = new OCREngineAdapter({ modelAdapter: stub });

  const response = await engine.parseReceipt({ image: 'receipt', language: 'en' });

  assert.equal(response.metadata?.documentType, 'receipt');
  assert.equal(response.structured?.blocks[0].type, 'paragraph');
});
