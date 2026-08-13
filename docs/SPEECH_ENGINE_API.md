**Speech Engine Public API**

Module: `core/speech`

Exports:
- `SpeechEngine` — constructor: `new SpeechEngine(options?: SpeechEngineOptions, registry?: CapabilityRegistry, orchestrator?: AIOrchestrator, runtime?: ModelRuntime)`
- `SttRequest`, `TtsRequest`, `SttResult`, `TtsResult` in `types.ts`.
- `speechEvents` — emits `SpeechRequested`, `SttCompleted`, `TtsCompleted`, `SpeechFailed`.

Adapter Contract (AI Orchestrator):
- Capabilities: `speech.stt`, `speech.tts`
- Adapter shape: `{ engineId: string, capability: string, execute: (req) => Promise<any> }`
- Inputs: STT adapters receive `{ input: SttRequest }`, TTS adapters receive `{ input: TtsRequest }`.

Result shapes:
- STT: `{ success: boolean, result?: SttResult, error?: string }`
- TTS: `{ success: boolean, result?: TtsResult, error?: string }`
