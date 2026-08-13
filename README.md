<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8c2c3e66-6109-4357-af6f-43f60f64bb67

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Validation

Use the repository validation commands to verify the full project and release readiness.

- `npm run validate` — runs lint, TypeScript compilation, production build, frontend tests, backend tests, functions build, and functions lint.
- `npm run validate:ci` — runs the same validation in CI-friendly mode without extra summary output.

## Production readiness

This project includes runtime health and readiness checks for the AI proxy backend.

- `GET /api/ai/health` — provider health, cache state, and platform readiness details.
- `GET /api/ai/liveness` — lightweight process liveness check for deployment probes.
- `GET /api/ai/ready` — production readiness check, verifies required provider secrets and active provider availability.

### Production Secrets Setup

The Firebase Functions backend uses server-side secrets for provider credentials. Configure these secrets in Firebase Secret Manager and keep local values out of source control.

Required function secret names:

- `OPENROUTER_KEY`
- `GROQ_KEY`
- `TOGETHER_KEY`
- `HF_KEY`
- `DEEPSEEK_KEY`
- `MISTRAL_KEY`
- `TAVILY_KEY`
- `GOOGLE_TTS_KEY`

Example Firebase CLI commands:

```bash
firebase functions:secrets:set OPENROUTER_KEY
firebase functions:secrets:set GROQ_KEY
firebase functions:secrets:set TOGETHER_KEY
firebase functions:secrets:set HF_KEY
firebase functions:secrets:set DEEPSEEK_KEY
firebase functions:secrets:set MISTRAL_KEY
firebase functions:secrets:set TAVILY_KEY
firebase functions:secrets:set GOOGLE_TTS_KEY
```

Access a configured secret for verification:

```bash
firebase functions:secrets:access OPENROUTER_KEY
```

Local emulator / development example (`.env.local`):

```env
OPENROUTER_KEY=sk-your-openrouter-key
GROQ_KEY=sk-your-groq-key
TOGETHER_KEY=sk-your-together-key
HF_KEY=hf-your-huggingface-key
DEEPSEEK_KEY=sk-your-deepseek-key
MISTRAL_KEY=sk-your-mistral-key
TAVILY_KEY=sk-your-tavily-key
GOOGLE_TTS_KEY=your-google-tts-key
```

> Never commit `.env.local` or any file containing real credentials.

GitHub Actions / CI example:

```yaml
- name: Configure Firebase secrets
  run: |
    echo "${{ secrets.OPENROUTER_KEY }}" > /tmp/openrouter.key
    firebase functions:secrets:set OPENROUTER_KEY --data-binary=@/tmp/openrouter.key
    echo "${{ secrets.GROQ_KEY }}" > /tmp/groq.key
    firebase functions:secrets:set GROQ_KEY --data-binary=@/tmp/groq.key
    # repeat for other provider keys
```

Ensure CI and deployment environments also have:

- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_APPLICATION_CREDENTIALS`

This repository uses secret names such as `OPENROUTER_KEY`, `GROQ_KEY`, `TOGETHER_KEY`, `DEEPSEEK_KEY`, `MISTRAL_KEY`, and `TAVILY_KEY`. External provider aliases such as `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `TOGETHER_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`, and `TAVILY_API_KEY` may be used in third-party docs, but the function runtime reads the repository secret names above.

For secret configuration guidance, see:
- `ENVIRONMENT_CONFIGURATION_GUIDE.md`
- `PROVIDER_CONFIGURATION_GUIDE.md`
- `PRODUCTION_SECRETS_CHECKLIST.md`

Deploy with:

```bash
firebase deploy --only hosting,functions
```
