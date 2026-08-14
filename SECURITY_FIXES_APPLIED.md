# Security and Reliability Notes

This project now keeps APIs and credentials out of the browser bundle and prefers local-first fallback behavior.

## Key points

- No frontend provider secrets are required for chat or local fallback.
- Admin credentials are not embedded in the browser app.
- Provider failures fail over to local logic without surfacing infrastructure details.
- Secret scanning is enforced via a git hook and CI-friendly script.

## Safe practices

- Keep credentials in a server-side secret manager.
- If a provider is unavailable, continue with the local engine.
- Do not expose provider names, status panels, or hidden diagnostics to end users.

## Validation

- Run `npm run secret:scan` before committing changes.
- Ensure `.env` files are not committed to the repository.
