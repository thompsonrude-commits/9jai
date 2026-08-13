import test from 'node:test';
import assert from 'node:assert/strict';
import { ImageEngineAdapter, ImageModelAdapter, ImageModelRequest, ImageModelResponse } from './ImageEngine.js';

class StubImageModel implements ImageModelAdapter {
  public readonly requests: ImageModelRequest[] = [];

  public async run(request: ImageModelRequest): Promise<ImageModelResponse> {
    this.requests.push(request);
    return {
      imageUrl: 'image://generated',
      operation: request.operation,
      metadata: { source: 'stub' },
    };
  }
}

test('generate produces a modular image result', async () => {
  const stub = new StubImageModel();
  const engine = new ImageEngineAdapter({ modelAdapter: stub });

  const response = await engine.generate({ prompt: 'A sunrise over Lagos' });

  assert.equal(response.imageUrl, 'image://generated');
  assert.equal(response.operation, 'generate');
});

test('renderText preserves user instructions in the request', async () => {
  const stub = new StubImageModel();
  const engine = new ImageEngineAdapter({ modelAdapter: stub });

  await engine.renderText({ prompt: 'Add text', text: 'Hello', instructions: 'Use bold font' });

  assert.equal(stub.requests[0].operation, 'renderText');
  assert.equal(stub.requests[0].instructions, 'Use bold font');
});
