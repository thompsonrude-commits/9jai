# Production Secrets Checklist

Use this checklist to prepare the `Edo Language Ai` backend for production deployment without leaking secrets.

## Secrets Setup

- [ ] Create each required provider secret in Firebase/Google Secret Manager:
  - `OPENROUTER_KEY`
  - `GROQ_KEY`
  - `TOGETHER_KEY`
  - `HF_KEY`
  - `DEEPSEEK_KEY`
  - `MISTRAL_KEY`
  - `TAVILY_KEY`
  - `GOOGLE_TTS_KEY`

- [ ] Confirm each secret is configured in the Firebase project and accessible to Cloud Functions.
- [ ] Do not commit secret values in repository files.
- [ ] If using local secrets for emulator testing, keep local `.env` files out of source control.

---

## Deployment Preparation

- [ ] Ensure `functions/src/index.ts` includes the required secret definitions and `ALL_SECRETS` list.
- [ ] Ensure each provider module uses the shared `getSecretValue()` helper and does not hard-code secret values.
- [ ] Verify `functions/src/providers/secretHelpers.ts` is used by all provider implementations.
- [ ] Set provider disable flags only when intended.

---

## Validation Before Deploying

- [ ] Run `npm run build` in `functions/` and confirm there are no TypeScript errors.
- [ ] Verify local emulator behavior with environment variables or local secret files.
- [ ] Test `/ai/health` and `/ai/ready` endpoints after starting the emulator.

---

## Production Deployment

- [ ] Run `firebase deploy --only functions` after secrets are configured.
- [ ] Confirm function deployment output references the required secret names.
- [ ] Check Cloud Functions logs for secret access failures.

---

## Post-Deployment Verification

- [ ] Query `/ai/ready` and confirm:
  - `status` is `ready`
  - `missingSecrets` is empty
  - `authFailedProviders` is empty
  - `unavailableProviders` is empty
- [ ] Query `/ai/health` and confirm provider statuses are not degraded or unavailable.
- [ ] Confirm at least one healthy provider is available.

---

## Secret Rotation

- [ ] Rotate production secrets by updating secret values in Secret Manager.
- [ ] Re-deploy or restart functions if required by your Firebase secret configuration.
- [ ] Validate `/ai/ready` after rotation.
- [ ] Keep a changelog of rotated secrets and rotation dates internally.

---

## Important Notes

- Never store provider API keys in frontend code.
- If a provider is intentionally unavailable, disable it via environment flags instead of removing secret references from code.
- Use readiness and health endpoints as the primary verification mechanism for configuration state.
