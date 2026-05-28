import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // ── SECURITY: API keys are NO LONGER injected into the client bundle ──
      // All AI calls now go through Firebase Cloud Functions (/api/ai/*)
      // Keys live in Cloud Functions secrets — never in the browser.
      //
      // Only expose a minimal fallback key for dev mode (direct Groq calls
      // when the emulator is not running). In production this is empty.
      'import.meta.env.VITE_GROQ_KEY': JSON.stringify(
        mode === 'development' ? (env.GROQ_API_KEY ?? '') : ''
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy /api/* to Firebase emulator in dev
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5001/jatalk-1274b/us-central1',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      // Optimize for mobile / African bandwidth
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
    },
  };
});
