**OCR Engine Public API**

Module: `core/ocr`

Exports:
- `OcrEngine` — main engine class. Constructor signature: `new OcrEngine(options?: OcrEngineOptions, registry?: CapabilityRegistry, orchestrator?: AIOrchestrator, runtime?: ModelRuntime, models?: ModelManager)`
- `OcrRequest`, `OcrResult`, and related types in `types.ts`.
- `ocrEvents` — emits `OcrRequested`, `OcrCompleted`, `OcrFailed` events.

Adapter Contract (for AI Orchestrator):
- Capability: `ocr.text`
- Adapter shape: `{ engineId: string, capability: string, execute: (req) => Promise<any> }`
- Input to `execute` should be an object with `input: OcrRequest`.

Result shape:
- `{ success: boolean, result?: OcrResult, error?: string }`

Notes:
- The current implementation is a placeholder pipeline returning minimal structured results. Integrations should call through the orchestrator to ensure auditing, scheduling and policy enforcement.
