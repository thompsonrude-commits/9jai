# Environment Configuration Guide

## Overview

This guide describes how to configure environment variables and Firebase Functions secrets for the `Edo Language Ai` AI proxy backend.

The backend is designed to load provider credentials from:
- Firebase Functions secrets via `firebase-functions/params`
- Local environment variables for development and emulator use

This means there are no hard-coded API keys in source control and no production secrets embedded in the client.

---

## Required Secret Names

Set these secret names in your Firebase project and, for local development, in environment variables:

- `OPENROUTER_KEY`
- `GROQ_KEY`
- `TOGETHER_KEY`
- `HF_KEY`
- `DEEPSEEK_KEY`
- `MISTRAL_KEY`
- `TAVILY_KEY`
- `GOOGLE_TTS_KEY`

---

## Local Development

For local dev or emulator testing, the code will read secret values from `process.env[SECRET_NAME]` when the Cloud Functions secret is not available.

### Option 1: `.env` / `.env.local`

Create a local environment file and add the provider keys there. Example:

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

> Do not commit `.env.local` or any file containing secrets to source control.

### Option 2: Environment variables in shell

Set environment variables directly before starting the emulator:

PowerShell:
```powershell
$env:OPENROUTER_KEY = 'sk-your-openrouter-key'
$env:GROQ_KEY = 'sk-your-groq-key'
$env:TOGETHER_KEY = 'sk-your-together-key'
$env:HF_KEY = 'hf-your-huggingface-key'
$env:DEEPSEEK_KEY = 'sk-your-deepseek-key'
$env:MISTRAL_KEY = 'sk-your-mistral-key'
$env:TAVILY_KEY = 'sk-your-tavily-key'
$env:GOOGLE_TTS_KEY = 'your-google-tts-key'
npm run serve
```

---

## Firebase Functions Secrets

In production, configure secrets using Google Secret Manager and reference them from Firebase Functions.

### Create or update a secret

Use Firebase CLI:

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

Follow the prompts to paste the secret value.

### Deploy after configuring secrets

```bash
firebase deploy --only functions
```

The Firebase Functions source already includes these secret parameters in `functions/src/index.ts` and the provider modules.

---

## Provider Enable/Disable Flags

This backend also supports disabling providers through environment flags.

Supported flags:

- `PROVIDER_<PROVIDER>_ENABLED`
- `PROVIDER_<PROVIDER>_DISABLED`
- `DISABLE_<PROVIDER>`

Example:

```bash
$env:PROVIDER_GROQ_DISABLED = 'true'
$env:PROVIDER_OPENROUTER_ENABLED = 'false'
```

A disabled provider will be marked as `disabled` in readiness status, and the router will avoid routing requests to it.

---

## How the code loads secrets

The shared helper in `functions/src/providers/secretHelpers.ts` performs secret lookup in this order:
1. Firebase Functions secret value from `firebase-functions/params` if available
2. Local environment variable `process.env[SECRET_NAME]`

This makes secrets safe for production while also convenient for local development.

---

## Validation

After deployment, verify the backend readiness endpoint:

```bash
curl https://<your-functions-url>/ai/ready
```

If required secrets are missing, the endpoint will report them under `missingSecrets`.
