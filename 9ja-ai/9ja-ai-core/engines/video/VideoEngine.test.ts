import test from 'node:test';
import assert from 'node:assert/strict';
import { VideoEngineAdapter, VideoModelAdapter, VideoModelRequest, VideoModelResponse } from './VideoEngine.js';

class StubVideoModel implements VideoModelAdapter {
  public readonly requests: VideoModelRequest[] = [];

  public async run(request: VideoModelRequest): Promise<VideoModelResponse> {
    this.requests.push(request);
    return {
      status: 'queued',
      jobId: 'job-1',
      progress: 0,
      message: 'Queued for processing',
      metadata: { source: 'stub' },
    };
  }
}

test('generateFromText returns a queued job when a compatible model is available', async () => {
  const stub = new StubVideoModel();
  const engine = new VideoEngineAdapter({ modelAdapter: stub });

  const response = await engine.generateFromText({ prompt: 'A river flowing' });

  assert.equal(response.status, 'queued');
  assert.equal(response.jobId, 'job-1');
  assert.equal(response.progress, 0);
});

test('returns an honest status when no compatible model is available', async () => {
  const engine = new VideoEngineAdapter();
  const response = await engine.generateFromText({ prompt: 'A river flowing' });

  assert.equal(response.status, 'unavailable');
  assert.match(response.message ?? '', /no compatible self-hosted/i);
});
