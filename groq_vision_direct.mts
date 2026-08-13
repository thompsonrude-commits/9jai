import { groqVision } from './functions/src/providers/groq.ts';
const url = 'https://httpbin.org/image/png';
const resp = await fetch(url);
if (!resp.ok) throw new Error('fetch failed '+resp.status);
const buf = Buffer.from(await resp.arrayBuffer()).toString('base64');
const result = await groqVision(buf, 'Describe this image in detail.', 'qwen/qwen3.6-27b');
console.log(JSON.stringify(result, null, 2));
