import { groqVisionWithFallback } from './functions/src/providers/groq.ts';
const url = 'https://httpbin.org/image/png';
const resp = await fetch(url);
if (!resp.ok) throw new Error('fetch failed '+resp.status);
const buf = Buffer.from(await resp.arrayBuffer()).toString('base64');
const result = await groqVisionWithFallback(buf, 'Analyze this image in detail.');
console.log(JSON.stringify(result, null, 2));
