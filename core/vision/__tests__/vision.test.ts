import assert from 'assert';
import { defaultVisionEngine } from '../visionEngine';

async function run() {
  const image = { id: 'img1', url: 'http://example.com/image1.jpg' };
  const analysis = await defaultVisionEngine.analyzeImage(image as any);
  assert(analysis.objects.length >= 1, 'expected objects');
  const objs = await defaultVisionEngine.detectObjects(image as any);
  assert(objs.length >= 1, 'expected detections');
  const cls = await defaultVisionEngine.classifyImage(image as any);
  assert(cls.length >= 1, 'expected classifications');
  const cmp = await defaultVisionEngine.compareImages([image as any, { id: 'img2', url: 'http://example.com/other.jpg' } as any]);
  assert(cmp.similarities.length === 2);
  const q = await defaultVisionEngine.answerVisualQuestion('What objects are present?', image as any, analysis);
  console.log('vision tests passed', { q });
}

run().catch(e => { console.error(e); process.exit(1); });
