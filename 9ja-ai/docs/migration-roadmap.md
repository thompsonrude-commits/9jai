# Migration Roadmap

## Phase 1: platform foundation

- Create the 9JA AI Core folder structure.
- Add orchestrator, inference, engine, model-manager, and service scaffolds.
- Introduce documentation and architecture boundaries.

## Phase 2: chat and language migration

- Move language-related requests behind the orchestrator boundary.
- Route chat, reasoning, coding, summaries, and writing to the language engine interface.
- Preserve the app's existing chat experience while introducing the new request path.

## Phase 3: vision and OCR

- Gradually move vision tasks and OCR tasks into dedicated engine adapters.
- Keep the current app behavior intact while the new engine implementations are introduced.

## Phase 4: image and video

- Introduce image generation and video generation workflows behind the new architecture.
- Support future model swapping without changing the app contract.

## Phase 5: speech and translation

- Migrate speech recognition, text-to-speech, translation, and localization capabilities.
- Standardize outputs so the app only depends on the core platform layer.

## Phase 6: platform independence

- Replace any remaining direct provider integrations with self-hosted or open-weight model execution.
- Introduce monitoring, cost controls, model evaluation, and deployment automation.
