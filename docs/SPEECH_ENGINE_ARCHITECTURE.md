**Speech Intelligence Engine Architecture (Phase 27)**

This document describes the Speech Intelligence Engine scaffold implemented under `core/speech`.

**Overview:**
- Purpose: provide STT/TTS, streaming support, VAD hooks, speaker awareness stubs, and integration points for Nigerian languages.
- Location: `core/speech`.

**Components implemented (scaffold):**
- `types.ts`: STT/TTS request and result shapes.
- `events.ts`: `speechEvents` EventEmitter for observability.
- `SpeechEngine.ts`: main engine class — registers `speech.stt` and `speech.tts` capabilities and adapters with the orchestrator.

**Integration points:**
- Capability Registry: registers `speech.stt` and `speech.tts`.
- AI Orchestrator: adapters are registered to route speech jobs through the orchestrator and scheduler.
- Model Runtime & Model Manager: `SpeechEngine` constructor accepts optional `ModelRuntime` for future inference routing.

**Processing workflow (placeholder):**
1. Requests come via orchestrator adapters.
2. `recognize()` or `synthesize()` run placeholder pipelines and emit events.
3. Results include transcripts and placeholder audio tokens.

**Extension points:**
- Add pipeline modules: `VAD`, `NoiseReducer`, `FeatureExtractor`, `ASRModelRunner`, `SpeakerDetector`, `TTSModelRunner`.
- Integrate with `NLIE` for language-aware recognition and code-switch handling.

**Security & Performance notes:**
- Ensure encrypted audio buffers and temporary file cleanup; orchestrator should enforce per-user isolation and retention policies.

**Next steps:**
- Implement model-backed ASR/TTS via `ModelManager` and `ModelRuntime`.
- Add streaming tests, noise robustness tests, and performance benchmarks.
