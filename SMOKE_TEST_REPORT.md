# Smoke Test Report — Local Emulator

Summary
- Environment: Firebase Functions emulator at `http://127.0.0.1:5001` (project `jatalk-1274b`).
- Goal: end-to-end smoke tests for OCR, Chat, and Streaming endpoints.

Results

- `v1Ocr` (PNG)
  - Status: 200
  - timeMs: 7187
  - Response: placeholder text: "Extracted text from https://upload.wikimedia.org/... (language=en)"
  - Layout: pages present but `blocks` empty
  - Note: provider call attempted but returned placeholder (likely missing provider secret)

- `v1Ocr` (JPG)
  - Status: 200
  - timeMs: 6023
  - Response: placeholder text for JPG source
  - Layout: pages present but `blocks` empty

- `v1Ocr` (PDF)
  - Status: 200
  - timeMs: 1567
  - Response: placeholder text for PDF source
  - Layout: pages present but `blocks` empty

- `aiChat`
  - Status: 200
  - timeMs: 10851
  - Provider: `groq` (model `llama-3.3-70b-versatile`)
  - Response: short text reply (see artifacts)

- `aiStream` (SSE streaming)
  - Status: 200 (streamed)
  - Streaming: received multiple `event: chunk` frames and `event: done`
  - Final meta: `provider: groq`, `model: llama-3.3-70b-versatile`, `latencyMs: 6317`, `tokensUsed: 400`

Artifacts
- See captured payloads and outputs in `functions/tmp/`:
  - `functions/tmp/v1ocr_png_result.json`
  - `functions/tmp/v1ocr_jpg_result.json`
  - `functions/tmp/v1ocr_pdf_result.json`
  - `functions/tmp/aiChat_result.json`
  - `functions/tmp/aiStream_result.txt`

Conclusions & Next Steps
- OCR handler and streaming endpoints are functioning and returning structured responses.
- OCR outputs are placeholder text (not provider-extracted). Likely cause: provider secrets (e.g., `OPENROUTER_KEY`) not configured in emulator.
- Recommended actions:
  1. Provide API secrets to the emulator (set via `firebase emulators:start --project <proj>` or use the Emulator UI / environment variables) so provider adapters can perform real OCR/image/video calls.
  2. Re-run the smoke tests after secrets are provisioned to validate provider-backed extraction and layout confidence.
  3. Fix SSE client test scripts for cross-platform quoting (PowerShell here-string approach used successfully).
