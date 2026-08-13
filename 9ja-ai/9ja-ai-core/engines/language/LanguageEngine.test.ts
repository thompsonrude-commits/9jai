import test from 'node:test';
import assert from 'node:assert/strict';
import { LanguageEngineAdapter, LanguageModelAdapter, LanguageModelRequest, LanguageModelResponse } from './LanguageEngine.js';

class StubModelAdapter implements LanguageModelAdapter {
  public readonly requests: LanguageModelRequest[] = [];

  public async complete(request: LanguageModelRequest): Promise<LanguageModelResponse> {
    this.requests.push(request);
    return {
      output: `handled:${request.operation}`,
      metadata: { source: 'stub' },
    };
  }
}

test('chat routes through the injected language model adapter', async () => {
  const stub = new StubModelAdapter();
  const engine = new LanguageEngineAdapter({ modelAdapter: stub });

  const response = await engine.chat({
    prompt: 'Hello there',
    context: { topic: 'greeting' },
  });

  assert.equal(response.output, 'handled:chat');
  assert.equal(stub.requests.length, 1);
  assert.equal(stub.requests[0].operation, 'chat');
  assert.equal(stub.requests[0].prompt, 'Hello there');
  assert.deepEqual(stub.requests[0].context, { topic: 'greeting' });
});

test('summarize includes memory context in the model request', async () => {
  const stub = new StubModelAdapter();
  const engine = new LanguageEngineAdapter({ modelAdapter: stub });

  await engine.summarize({
    prompt: 'Summarize this session',
    memory: { lastTopic: 'travel', lastSummary: 'planned a trip' },
  });

  assert.equal(stub.requests[0].operation, 'summarize');
  assert.equal(stub.requests[0].context?.memory?.lastTopic, 'travel');
  assert.equal(stub.requests[0].context?.memory?.lastSummary, 'planned a trip');
});
