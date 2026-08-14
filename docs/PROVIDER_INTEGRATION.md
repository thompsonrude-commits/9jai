# Provider Integration Guide

This project is intentionally local-first. External providers are optional accelerators and never the only runtime path.

## Security rules

- Keep all provider credentials server-side only.
- Never store keys in frontend code, localStorage, or public bundles.
- Prefer Firebase Secret Manager or secure server-side env configuration.
- If a provider is unavailable or rejected, fail over locally without exposing infrastructure details to users.

## Supported patterns

- Backend service endpoints that accept `{ task, prompt, maxTokens, temperature }`
- Secure server-side secret retrieval
- Local fallback generation for chat, image, OCR, and search

## Safe configuration pattern

Use environment variables only on the server side, for example:

- `GROQ_API_KEY`
- `HUGGINGFACE_API_KEY`
- `OPENROUTER_API_KEY`

Never use `VITE_` variables for provider secrets.

## Fallback behavior

- If a provider times out, rejects, or returns malformed output, switch to the next available local or proxy route.
- Never expose network or infrastructure errors to the user.
- Keep retries bounded and only attempt transient recovery for a small subset of statuses.
