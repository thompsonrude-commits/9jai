# Release Readiness Report

## Validation Summary

Completed repository-wide validation on `npm run validate` and CI-friendly validation on `npm run validate:ci`.

### Results
- `npm run validate` completed successfully.
- `npm run validate:ci` completed successfully.

## What was validated

- Root repository lint: `npm run lint` (`tsc --noEmit`)
- Production frontend build: `npm run build` (`vite build`)
- Frontend test suite: `npm run test` (`node scripts/run-tests.mjs`)
- Backend test suite: `npm run test:backend` (`npm --prefix functions run test`)
- Functions build: `npm --prefix functions run build` (`tsc`)
- Functions lint: `npm --prefix functions run lint` (`tsc --noEmit`)

## Repository hardening

- Added `scripts/validate.mjs` as a centralized validation pipeline.
- Added `npm run validate` and `npm run validate:ci` in root `package.json`.
- Added `functions/coverage/` to `.gitignore` and preserved `functions/lib/` exclusion.
- Updated documentation in `README.md` and `docs/ENGINEERING_HANDBOOK.md` to reference validation workflows.
- Added production runtime probe endpoints and provider readiness reporting to the Firebase functions backend.

## Known warnings

- `vite build` emits dynamic import warnings for `src/lib/aiProxy.ts` and `src/lib/language.ts`.
- `functions` package warns about `allow-scripts` npm config; this is unrelated to validation logic and arises from local npm configuration.

## Notes

The validation workflow now ensures generated build artifacts do not interfere with test discovery, and the functions package uses explicit source-based Vitest discovery.
