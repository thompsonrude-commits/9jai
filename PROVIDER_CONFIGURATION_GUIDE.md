# Provider Configuration Guide

This guide explains how provider credentials are configured and how the AI proxy backend routes requests to provider APIs.

## Supported Providers

| Provider | Secret Name | Usage | Notes |
|---|---|---|---|
| OpenRouter | `OPENROUTER_KEY` | chat, vision, OCR | Primary multimodal provider for text and vision tasks |
| Groq | `GROQ_KEY` | chat, whisper transcription | Fast inference and audio transcription |
| TogetherAI | `TOGETHER_KEY` | chat, image generation | Open-source chat plus image generation |
| HuggingFace | `HF_KEY` | chat, image generation | Inference API for models and stable diffusion |
| DeepSeek | `DEEPSEEK_KEY` | chat | Fast reasoning and coding models |
| Mistral | `MISTRAL_KEY` | chat | Mistral AI chat completion provider |
| Tavily | `TAVILY_KEY` | web search, extraction | Web search and content extraction provider |
| Google TTS | `GOOGLE_TTS_KEY` | text-to-speech | Nigerian English speech synthesis |

---

## Routing and Readiness

The backend exposes a readiness endpoint with detailed provider status.

- `GET /ai/ready` returns `ready` only when at least one healthy provider exists and no required providers have missing secrets, auth failures, or are unavailable.
- Providers are evaluated by `functions/src/media/providerRegistry.ts`.
- Each provider report includes:
  - `providerId`
  - `status`
  - `secretConfigured`
  - `disabled`
  - `ready`
  - `details`

The provider status categories are:
- `disabled` — provider has been explicitly disabled via environment flags
- `missing-secret` — required secret is not configured
- `auth-failed` — authentication failed or invalid key
- `unavailable` — provider is reporting repeated failures or downtime
- `degraded` — provider has warnings or slow responses
- `healthy` — provider is configured and available

---

## Provider Flags and Secrets

### Secret variables

The backend expects provider credentials to be configured as secret names matching the provider key names above.

### Disable flags

Use these environment variables to opt providers out without removing their secrets:

- `PROVIDER_OPENROUTER_DISABLED` / `DISABLE_OPENROUTER`
- `PROVIDER_GROQ_DISABLED` / `DISABLE_GROQ`
- `PROVIDER_TOGETHER_DISABLED` / `DISABLE_TOGETHER`
- `PROVIDER_HUGGINGFACE_DISABLED` / `DISABLE_HUGGINGFACE`
- `PROVIDER_DEEPSEEK_DISABLED` / `DISABLE_DEEPSEEK`
- `PROVIDER_MISTRAL_DISABLED` / `DISABLE_MISTRAL`
- `PROVIDER_TAVILY_DISABLED` / `DISABLE_TAVILY`

Any value of `true`, `1`, `yes`, or `on` will disable the provider.

---

## Frontend and Secret Safety

Do not ship provider secrets in frontend code.

- Client apps should never embed `OPENROUTER_KEY`, `HF_KEY`, or any provider secret.
- This backend is the secure server-side proxy that keeps credentials secret.
- If calling providers from the browser, route through the Firebase Functions API only.

---

## Example Provider Setup

1. Create a secret in Secret Manager and configure it in Firebase.
2. Deploy functions with the new secret.
3. Use `/ai/health` and `/ai/ready` to verify provider status.
4. If a provider is intentionally disabled, confirm the readiness endpoint lists it under `disabledProviders`.

---

## Provider Status Troubleshooting

- `missing-secret`: add the missing secret to Firebase and redeploy.
- `auth-failed`: verify the secret value and provider account permissions.
- `unavailable`: investigate provider outage or rate limits.
- `degraded`: monitor logs, consider fallback provider routing.
