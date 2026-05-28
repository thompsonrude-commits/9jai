#!/usr/bin/env node
/*
  E2E STT+TTS test harness

  Usage:
    node scripts/e2e_tts_stt.js [--transcribe-url URL] [--tts-url URL] sample1.wav[:lang] sample2.webm[:lang]

  Defaults (emulator):
    TRANSCRIBE_URL = http://127.0.0.1:5001/jatalk-1274b/us-central1/aiTranscribe
    TTS_URL = http://127.0.0.1:5001/jatalk-1274b/us-central1/aiTTS

  Example:
    node scripts/e2e_tts_stt.js samples/edo_hello.webm:edo
*/

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const argv = process.argv.slice(2);
let TRANSCRIBE_URL = process.env.TRANSCRIBE_URL || 'http://127.0.0.1:5001/jatalk-1274b/us-central1/aiTranscribe';
let TTS_URL = process.env.TTS_URL || 'http://127.0.0.1:5001/jatalk-1274b/us-central1/aiTTS';

const samples = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--transcribe-url' && argv[i+1]) { TRANSCRIBE_URL = argv[++i]; continue; }
  if (a === '--tts-url' && argv[i+1]) { TTS_URL = argv[++i]; continue; }
  samples.push(a);
}

if (samples.length === 0) {
  console.log('\nNo samples provided. Usage:');
  console.log('  node scripts/e2e_tts_stt.js [--transcribe-url URL] [--tts-url URL] sample1.wav[:lang] sample2.webm[:lang]');
  console.log('\nDefaults:');
  console.log('  TRANSCRIBE_URL =', TRANSCRIBE_URL);
  console.log('  TTS_URL        =', TTS_URL);
  process.exit(0);
}

function extToMime(ext) {
  ext = ext.toLowerCase();
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.webm') return 'audio/webm';
  if (ext === '.ogg') return 'audio/ogg';
  return 'application/octet-stream';
}

function assistantForLang(code) {
  const M = { pcm: 'nosa', yo: 'nosa', ig: 'nosa', ha: 'nosa', edo: 'nosa', efk: 'nosa', tiv: 'nosa', fuv: 'nosa', kan: 'nosa', sw: 'nosa' };
  return M[code] || 'nosa';
}

(async () => {
  try {
    if (!fs.existsSync('scripts/e2e_outputs')) fs.mkdirSync('scripts/e2e_outputs');

    for (const s of samples) {
      const [filePath, lang] = s.split(':');
      if (!fs.existsSync(filePath)) { console.error('File not found:', filePath); continue; }
      const ext = path.extname(filePath);
      const mimeType = extToMime(ext);
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');

      console.log('\n---');
      console.log('Sample:', filePath, 'mimeType=', mimeType, 'lang=', lang || '');

      // Transcribe
      console.log('Sending to transcribe endpoint:', TRANSCRIBE_URL);
      const tRes = await fetch(TRANSCRIBE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType, language: lang || '' }),
        timeout: 60000,
      });
      if (!tRes.ok) {
        const txt = await tRes.text().catch(()=>'<no body>');
        console.error('Transcribe failed:', tRes.status, txt);
        continue;
      }
      const tJson = await tRes.json();
      console.log('Transcribe result:', tJson);
      const text = tJson.text || tJson || '';

      if (!text) {
        console.log('Empty transcription, skipping TTS.');
        continue;
      }

      // TTS
      console.log('Sending to TTS endpoint:', TTS_URL);
      const assistantId = assistantForLang(lang || '');
      const pRes = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, assistantId }),
        timeout: 60000,
      });
      if (!pRes.ok) {
        const txt = await pRes.text().catch(()=>'<no body>');
        console.error('TTS failed:', pRes.status, txt);
        continue;
      }
      const pJson = await pRes.json();
      if (pJson.fallback) {
        console.warn('TTS returned fallback flag; browser TTS should be used instead.');
        continue;
      }
      if (!pJson.audioBase64) { console.error('TTS returned no audio'); continue; }

      const outBuffer = Buffer.from(pJson.audioBase64, 'base64');
      let outExt = '.mp3';
      if (pJson.contentType && pJson.contentType.includes('webm')) outExt = '.webm';
      if (pJson.contentType && pJson.contentType.includes('wav')) outExt = '.wav';
      const outName = path.basename(filePath, path.extname(filePath)) + '.tts' + outExt;
      const outPath = path.join('scripts', 'e2e_outputs', outName);
      fs.writeFileSync(outPath, outBuffer);
      console.log('Saved TTS audio to', outPath);
    }

    console.log('\nAll done.');
  } catch (err) {
    console.error('Error running harness:', err);
  }
})();
