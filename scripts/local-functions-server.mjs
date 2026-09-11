import express from 'express';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const index = require('../functions/lib/index.js');
const app = express();
const port = Number(process.env.LOCAL_FUNCTIONS_PORT || 5001);

// Accept raw binary bodies for spreadsheet and other binary endpoints before JSON body parser
app.use(express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '100mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const aliasMap = {
  aiChat: ['/aiChat', '/api/ai/chat', '/api/v1/chat'],
  aiStream: ['/aiStream', '/api/ai/stream', '/api/v1/stream'],
  aiImage: ['/aiImage', '/api/ai/image'],
  aiFetchImage: ['/aiFetchImage', '/api/ai/fetchImage', '/api/v1/image/fetch'],
  aiTranscribe: ['/aiTranscribe', '/api/ai/transcribe', '/api/v1/transcribe', '/api/v1/speech/transcribe'],
  aiSearch: ['/aiSearch', '/api/ai/search', '/api/v1/search'],
  aiHealth: ['/aiHealth', '/api/ai/health', '/api/v1/health'],
  aiLiveness: ['/aiLiveness', '/api/ai/liveness'],
  aiReady: ['/aiReady', '/api/ai/ready'],
  aiTime: ['/aiTime', '/api/ai/time'],
  aiWeather: ['/aiWeather', '/api/ai/weather'],
  aiVision: ['/aiVision', '/api/ai/vision', '/api/v1/vision', '/api/v1/vision/analyze'],
  v1Ocr: ['/v1Ocr', '/api/v1/ocr'],
  v1ImageGenerate: ['/v1ImageGenerate', '/api/v1/image/generate'],
  v1Providers: ['/v1Providers', '/api/v1/providers'],
  v1EdoLexicon: ['/v1EdoLexicon', '/api/v1/edo/lexicon'],
  v1VisualOrchestrator: ['/v1VisualOrchestrator', '/api/v1/visual-orchestrator'],
  v1Document: ['/v1Document', '/api/v1/documents'],
  v1VideoProcess: ['/v1VideoProcess', '/api/v1/video/process'],
  v1VideoStatus: ['/v1VideoStatus', '/api/v1/video/status'],
  v1PluginRegistry: ['/v1PluginRegistry', '/api/v1/plugins'],
  v1ConnectorRegistry: ['/v1ConnectorRegistry', '/api/v1/connectors'],
  aiVideo: ['/aiVideo', '/api/v1/video'],
  v1SpreadsheetParse: ['/v1SpreadsheetParse', '/api/v1/spreadsheet/parse'],
  v1ChartGenerate: ['/v1ChartGenerate', '/api/v1/chart/generate'],
  aiTTS: ['/aiTTS', '/api/ai/tts', '/api/v1/speech/synthesize'],
};

for (const [handlerName, aliases] of Object.entries(aliasMap)) {
  const fn = index[handlerName];
  if (!fn) continue;
  for (const alias of aliases) {
    app.all(alias, (req, res, next) => fn(req, res, next));
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: '9jai-local-functions' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'not-found', path: req.path });
});

app.listen(port, () => {
  console.log(`9JAI local function bridge listening on http://127.0.0.1:${port}`);
});
