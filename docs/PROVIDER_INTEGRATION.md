Provider Integration Guide

This project supports routing requests to multiple AI providers via configured HTTP endpoints.

Configuration

For each provider you want to enable, set two environment variables in your Vite environment (or server env if running server-side):

- `VITE_PROVIDER_<NAME>_URL` — the HTTP endpoint that accepts POST JSON of shape `{ task, prompt, maxTokens, temperature }` and returns JSON.
- `VITE_PROVIDER_<NAME>_KEY` — optional API key to pass in `Authorization: Bearer <KEY>` header.

Examples (in `.env` or CI environment):

VITE_PROVIDER_OPENROUTER_URL=https://api.openrouter.example/route
VITE_PROVIDER_OPENROUTER_KEY=sk-xxxx

VITE_PROVIDER_HUGGINGFACE_URL=https://api-inference.huggingface.co/models/your-model
VITE_PROVIDER_HUGGINGFACE_KEY=hf_xxx

Notes
- Client-side builds will embed any `VITE_` env variables into the bundle. For production, prefer using server-side proxies (Cloud Functions) to keep keys secret.
- The HTTP endpoint can be a small proxy function that translates the unified contract into provider-specific API calls.

Serverless Proxy (recommended)
- Implement simple serverless endpoints (Firebase Functions, Cloud Run, AWS Lambda) that accept the unified request and call provider APIs using server-side secrets. The app can then point `VITE_PROVIDER_<NAME>_URL` to that proxy.

Next steps
- I can scaffold example Firebase Functions proxies for OpenRouter, HuggingFace, TogetherAI, Groq, Ollama, and Pollinations. Reply "scaffold functions" to continue and I will add them and deploy (you'll need to provide secrets or set them in Firebase Console).