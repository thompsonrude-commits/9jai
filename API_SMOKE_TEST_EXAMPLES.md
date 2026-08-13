# API Smoke Test Examples

Notes
- Emulator base URL: `http://127.0.0.1:5001/jatalk-1274b/us-central1`
- On Windows, prefer PowerShell here-string to write JSON payload files to avoid quoting issues; then use `curl.exe --data-binary @file`.

1) `v1Ocr` — POST JSON

Linux / macOS (curl)

`curl -X POST "http://127.0.0.1:5001/jatalk-1274b/us-central1/v1Ocr" -H "Content-Type: application/json" -d '{"imageUrl":"https://example.com/image.png","language":"en","layout":true}'`

Windows PowerShell (recommended)

`@'
{"imageUrl":"https://example.com/image.png","language":"en","layout":true}
'@ | Out-File tmp/v1ocr_payload.json -Encoding utf8`

`curl.exe -X POST "http://127.0.0.1:5001/jatalk-1274b/us-central1/v1Ocr" -H "Content-Type: application/json" --data-binary @tmp/v1ocr_payload.json`

2) `aiChat` — synchronous chat

Linux / macOS

`curl -X POST "http://127.0.0.1:5001/jatalk-1274b/us-central1/aiChat" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hello"}],"task":"chat"}'`

PowerShell

`@'
{"messages":[{"role":"user","content":"Hello"}],"task":"chat"}
'@ | Out-File tmp/aichat_payload.json -Encoding utf8`

`curl.exe -X POST "http://127.0.0.1:5001/jatalk-1274b/us-central1/aiChat" -H "Content-Type: application/json" --data-binary @tmp/aichat_payload.json`

3) `aiStream` — SSE streaming

Linux / macOS

`curl -N -X POST "http://127.0.0.1:5001/jatalk-1274b/us-central1/aiStream" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Tell me a short story about a fisherman."}],"task":"stream"}'`

PowerShell (works around quoting)

`@'
{"messages":[{"role":"user","content":"Tell me a short story about a fisherman."}],"task":"stream"}
'@ | Out-File tmp/stream_payload.json -Encoding utf8

`curl.exe -N -X POST "http://127.0.0.1:5001/jatalk-1274b/us-central1/aiStream" -H "Content-Type: application/json" --data-binary @tmp/stream_payload.json`

4) Tips
- If providers return placeholder outputs, ensure required secrets are available to the emulator (e.g., `OPENROUTER_KEY`, `GOOGLE_TTS_KEY`).
- For long-running endpoints increase client timeouts.
