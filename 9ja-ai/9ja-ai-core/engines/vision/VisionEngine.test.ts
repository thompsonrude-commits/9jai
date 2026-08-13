import test from 'node:test';
import assert from 'node:assert/strict';
import { VisionEngineAdapter, VisionModelAdapter, VisionModelRequest, VisionModelResponse } from './VisionEngine.js';

class StubVisionAdapter implements VisionModelAdapter {
  public readonly requests: VisionModelRequest[] = [];

  public async analyze(request: VisionModelRequest): Promise<VisionModelResponse> {
    this.requests.push(request);
    return {
      findings: [
        {
          label: 'chair',
          category: 'object',
          confidence: 0.41,
          explanation: 'Low-confidence prediction due to blur and occlusion.',
          uncertain: true,
        },
      ],
      summary: 'A partially visible indoor scene.',
      confidence: 0.41,
      uncertainty: 'The prediction is uncertain because the image is blurry.',
    };
  }
}

test('detectObjects returns confidence and uncertainty explanations', async () => {
  const stub = new StubVisionAdapter();
  const engine = new VisionEngineAdapter({ modelAdapter: stub });

  const response = await engine.detectObjects({
    image: 'sample-image',
    prompt: 'Find objects in this image',
  });

  assert.equal(response.findings[0].label, 'chair');
  assert.equal(response.findings[0].confidence, 0.41);
  assert.equal(response.findings[0].uncertain, true);
  assert.match(response.findings[0].explanation ?? '', /uncertain|blur|occlusion/i);
  assert.match(response.uncertainty ?? '', /uncertain/i);
});

test('compareImages produces a multi-image comparison response', async () => {
  const stub = new StubVisionAdapter();
  const engine = new VisionEngineAdapter({ modelAdapter: stub });

  const response = await engine.compareImages({
    images: ['img-1', 'img-2'],
    prompt: 'Compare these two images',
  });

  assert.equal(response.summary, 'A partially visible indoor scene.');
  assert.equal(response.metadata?.comparisonMode, 'multi-image');
});
