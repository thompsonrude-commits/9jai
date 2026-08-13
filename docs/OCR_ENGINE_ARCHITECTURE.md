**OCR Engine Architecture**

This document describes the Phase 25 OCR Engine architecture scaffold implemented under `core/ocr`.

**Overview:**
- Purpose: extract structured text and layout from images and documents and expose an engine adapter for the AI Orchestrator.
- Location: `core/ocr`.

**Components implemented (scaffold):**
- `types.ts`: request/response data shapes (`OcrRequest`, `OcrResult`, pages/blocks/spans).
- `events.ts`: local `ocrEvents` EventEmitter for observability hooks.
- `OcrEngine.ts`: main engine class — registers capability with `CapabilityRegistry`, registers an adapter with `AIOrchestrator`, and exposes `execute` which runs the OCR pipeline.

**Integration points:**
- Capability Registry: registers capability `ocr.text` with category `ocr`.
- AI Orchestrator: engine registers adapter via `orchestrator.registerAdapter({ capability: 'ocr.text', execute })`.
- Model Runtime & Model Manager: architected for future model-backed inference (constructor accepts optional references). Current implementation is model-independent placeholder pipeline.

**Processing pipeline (placeholder):**
1. Request received via orchestrator adapter.
2. `OcrEngine.execute` runs a lightweight pipeline that emits `OcrRequested` and `OcrCompleted` events.
3. Result contains page-level blocks and spans, plus `rawText` and `metadata`.

**Extension points:**
- `OcrEngine` constructor accepts `ModelRuntime` and `ModelManager` for future model discovery and inference.
- Add modular pipeline components: `DocumentAnalyzer`, `Preprocessor`, `TextRecognizer`, `LayoutAnalyzer`, `TableExtractor`, `PostProcessor`.

**Security & Performance notes:**
- Temporary file handling and retention policies should be enforced by the orchestrator/request gateway before passing data to this engine.
- The scaffold supports streaming and incremental processing in the capability descriptor; actual streaming implementation is future work.

**Next steps:**
- Implement concrete pipeline stages using chosen OCR models or external services.
- Add comprehensive integration tests for multi-page PDFs, tables, rotated docs, and large-file streaming.
- Implement secure temp storage and audit logging.
