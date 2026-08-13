# Known Limitations

## Current Limitations

- The backend relies on third-party provider credentials that must be configured in Firebase Secret Manager.
- Some AI provider integrations may be disabled if a secret is missing or the provider is temporarily unavailable.
- TTS uses Google Cloud TTS service and requires `GOOGLE_TTS_KEY` to be configured.
- The image and video generation routes can be rate-limited or affected by external provider throttling.

## Deployment Constraints

- Production readiness depends on correct secret names and Firebase Secrets configuration.
- The local emulator should only be used for development and testing; real production keys must be managed in a secure vault.
- `GET /ai/ready` may return `503` if no active provider is available, even if the function is deployed successfully.

## Documentation Notes

- Ensure `README.md`, `DEPLOYMENT_STATUS_MAY_2026_FINAL.md`, and `DOCUMENTATION_INDEX.md` remain synchronized with provider secret requirements.
- Document any new provider integrations and secret names before adding them to the production deployment.

## Future Work

- Add automated deployment verification scripts for readiness and health endpoints.
- Add secret rotation procedures to `PRODUCTION_SECRETS_CHECKLIST.md`.
- Add provider-level usage and cost controls for production deployments.
