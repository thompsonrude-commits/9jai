import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy app requests to the local HTTP bridge that exposes the compiled Firebase handlers.
      // The project-specific Firebase path is not required here because the local bridge mounts the routes directly.
      proxy: {
        '/api/ai/chat': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/chat/, '/aiChat') },
        '/api/ai/stream': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/stream/, '/aiStream') },
        '/api/ai/image': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/image/, '/aiImage') },
        '/api/ai/fetchImage': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/fetchImage/, '/aiFetchImage') },
        '/api/ai/transcribe': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/transcribe/, '/aiTranscribe') },
        '/api/ai/search': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/search/, '/aiSearch') },
        '/api/ai/health': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/health/, '/aiHealth') },
        '/api/ai/vision': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/vision/, '/aiVision') },
        '/api/ai/tts': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/ai\/tts/, '/aiTTS') },
        '/api/v1/chat': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/chat/, '/aiChat') },
        '/api/v1/stream': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/stream/, '/aiStream') },
        '/api/v1/search': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/search/, '/aiSearch') },
        '/api/v1/transcribe': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/transcribe/, '/aiTranscribe') },
        '/api/v1/speech/transcribe': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/speech\/transcribe/, '/aiTranscribe') },
        '/api/v1/speech/synthesize': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/speech\/synthesize/, '/aiTTS') },
        '/api/v1/health': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/health/, '/aiHealth') },
        '/api/v1/image/generate': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/image\/generate/, '/v1ImageGenerate') },
        '/api/v1/spreadsheet/parse': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/spreadsheet\/parse/, '/v1SpreadsheetParse') },
        '/api/v1/chart/generate': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/chart\/generate/, '/v1ChartGenerate') },
        '/api/v1/image/fetch': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/image\/fetch/, '/aiFetchImage') },
        '/api/v1/video': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/video/, '/aiVideo') },
        '/api/v1/video/process': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/video\/process/, '/v1VideoProcess') },
        '/api/v1/video/status': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/video\/status/, '/v1VideoStatus') },
        '/api/v1/plugins': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/plugins/, '/v1PluginRegistry') },
        '/api/v1/connectors': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/connectors/, '/v1ConnectorRegistry') },
        '/api/v1/documents': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/documents/, '/v1Document') },
        '/api/v1/ocr': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/ocr/, '/v1Ocr') },
        '/api/v1/vision': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/vision/, '/aiVision') },
        '/api/v1/vision/analyze': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/vision\/analyze/, '/aiVision') },
        '/api/v1/visual-orchestrator': { target: 'http://127.0.0.1:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/v1\/visual-orchestrator/, '/v1VisualOrchestrator') },
      },
    },
    build: {
      // Optimize for mobile / African bandwidth
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'motion': ['motion/react'],
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'lucide': ['lucide-react'],
          },
        },
      },
    },
  };
});
