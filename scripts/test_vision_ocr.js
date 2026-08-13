import fs from 'fs';
import fetch from 'node-fetch';

async function dataUrlFromFile(p) {
  const buf = await fs.promises.readFile(p);
  const ext = p.split('.').pop().toLowerCase();
  const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function postJson(url, body) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), timeout: 60000 });
    const text = await res.text();
    return { status: res.status, ok: res.ok, text };
  } catch (err) {
    return { error: String(err) };
  }
}

(async () => {
  const base = 'http://localhost:3003';
  const files = {
    small: 'C:/Users/Caterpilla/Downloads/africa language/Edo Language Ai/test-small.svg',
    normal: 'C:/Users/Caterpilla/Downloads/africa language/Edo Language Ai/test-normal.svg',
    large: 'C:/Users/Caterpilla/Downloads/africa language/Edo Language Ai/test-large.svg',
  };

  for (const [key, path] of Object.entries(files)) {
    if (!fs.existsSync(path)) { console.log('Missing', path); continue; }
    const stat = await fs.promises.stat(path);
    console.log(`\n=== ${key.toUpperCase()} (${stat.size} bytes) ===`);
    const dataUrl = await dataUrlFromFile(path);

    console.log('POST /api/v1/ocr');
    const ocr = await postJson(base + '/api/v1/ocr', { imageUrl: dataUrl, language: 'eng', layout: false });
    console.log('OCR ->', ocr.status ?? 'ERR', ocr.ok ?? false);
    console.log(ocr.text ?? ocr.error);

    console.log('POST /vision/analyze');
    const vision = await postJson(base + '/vision/analyze', { imageBase64: dataUrl, prompt: 'Describe this image' });
    console.log('VISION ->', vision.status ?? 'ERR', vision.ok ?? false);
    console.log(vision.text ?? vision.error);
  }
})();
