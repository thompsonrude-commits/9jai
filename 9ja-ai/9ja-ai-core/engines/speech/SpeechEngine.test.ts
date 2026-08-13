import test from 'node:test';
import assert from 'node:assert/strict';
import { SpeechEngineAdapter, SpeechModelAdapter, SpeechModelRequest, SpeechModelResponse } from './SpeechEngine.js';

class StubSpeechAdapter implements SpeechModelAdapter {
  public readonly requests: SpeechModelRequest[] = [];

  public async run(request: SpeechModelRequest): Promise<SpeechModelResponse> {
    this.requests.push(request);
    return {
      text: 'Hello from speech',
      audio: 'audio-bytes',
      stream: true,
      interruption: false,
      conversationMode: true,
      vad: true,
      metadata: { source: 'stub' },
    };
  }
}

test('transcribe returns speech output', async () => {
  const stub = new StubSpeechAdapter();
  const engine = new SpeechEngineAdapter({ modelAdapter: stub });

  const response = await engine.transcribe({ audio: 'sample-audio', language: 'en' });

  assert.equal(response.text, 'Hello from speech');
  assert.equal(response.metadata?.language, 'en');
});

test('converse enables conversation mode and VAD', async () => {
  const stub = new StubSpeechAdapter();
  const engine = new SpeechEngineAdapter({ modelAdapter: stub });

  const response = await engine.converse({ audio: 'sample-audio', language: 'en' });

  assert.equal(response.conversationMode, true);
  assert.equal(response.vad, true);
  assert.equal(response.interruption, false);
});
