/**
 * Vercel Serverless Function Entry Point
 * This adapts Firebase Cloud Functions to Vercel's serverless format
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

// Import all Firebase function handlers
const functionHandlers = require('../functions/lib/index');

// Create Express app
const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const allowed = 
    origin.includes('9jai.web.app') || 
    origin.includes('9jai.firebaseapp.com') ||
    origin.includes('localhost');
  
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://9jai.web.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, X-User-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  next();
});

// Map Firebase function names to routes
const functionMap: Record<string, string[]> = {
  aiChat: ['/api/ai/chat', '/api/v1/chat'],
  aiStream: ['/api/ai/stream', '/api/v1/stream'],
  aiImage: ['/api/ai/image'],
  aiFetchImage: ['/api/ai/fetchImage', '/api/v1/image/fetch'],
  aiTranscribe: ['/api/ai/transcribe', '/api/v1/transcribe'],
  aiSearch: ['/api/ai/search', '/api/v1/search'],
  aiHealth: ['/api/ai/health', '/api/v1/health'],
  aiVision: ['/api/ai/vision', '/api/v1/vision/analyze'],
  v1ImageGenerate: ['/api/v1/image/generate'],
  v1Providers: ['/api/v1/providers'],
  v1EdoLexicon: ['/api/v1/edo/lexicon'],
};

// Register all routes
for (const [funcName, routes] of Object.entries(functionMap)) {
  const handler = functionHandlers[funcName];
  if (!handler) continue;
  
  for (const route of routes) {
    app.all(route, (req, res) => handler(req, res));
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: '9jai-vercel-backend', timestamp: Date.now() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'not-found', path: req.path });
});

// Export for Vercel
export default app;
