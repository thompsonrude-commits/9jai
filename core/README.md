# 9JA AI — Core Engine Architecture

The `core/` directory contains the central AI engine infrastructure for the 9JA AI platform. It is runtime-oriented and model-driven, meaning underlying execution paths can evolve without changing application logic.

## Structure

```
core/
├── orchestrator/       # Main AIOrchestrator — coordinates all engines
├── runtime/            # Model runtime abstraction and execution routing
├── scheduler/          # Inference scheduler for queueing and coordination
├── capabilities/       # Capability registry for dynamic engine registration
├── knowledge/          # Knowledge engine for RAG, semantic search, indexing
├── observability/      # Metrics, tracing, health monitoring, error reporting
├── engines/
│   ├── language/       # Language detection, NLP, multilingual support
│   ├── vision/         # Image analysis, object detection
│   ├── image/          # Image generation and editing
│   ├── video/          # Video generation and processing
│   ├── speech/         # Text-to-speech and speech-to-text
│   ├── translation/    # Cross-language translation
│   ├── memory/         # Conversation and long-term context memory
│   └── ocr/            # Optical character recognition
├── models/             # Model registry and selection
├── services/           # Top-level AIService entry point
├── config/             # Configuration types and defaults
├── cache/              # Response and embedding cache
├── logging/            # Structured logging
├── integrations/      # Universal integration and connector platform
├── security/          # Enterprise security, governance, and trust platform
├── operations/        # Developer console and platform operations center
└── utils/              # Shared TypeScript types and helpers
```

## Design Principles

- **Runtime-centric**: The runtime resolves model execution paths rather than relying on provider-specific logic.
- **Modular**: Each engine is independently testable and replaceable.
- **African-language-first**: Language and translation engines are built with Edo, Yoruba, Igbo, Hausa and other Nigerian/African languages as primary targets.
- **Extensible**: New capabilities and engines can be registered dynamically through the Capability Registry.
- **Observable**: Tracing, metrics, health monitoring, and error reporting are first-class concerns.

## Getting Started

1. Configure runtime and model defaults in `core/config/AIConfig.ts`.
2. Instantiate `AIService` from `core/services/AIService.ts`.
3. Use the `AIOrchestrator` to route requests to the appropriate engine.

## Implementation Phases

- **Phase 1**: Scaffold interfaces and orchestration foundation ✅
- **Phase 2**: Introduce runtime, scheduler, capability registry, and knowledge engine ✅
- **Phase 3**: Implement language + translation engines
- **Phase 4**: Implement speech (TTS/STT) engine
- **Phase 5**: Implement vision, image generation, video engines
- **Phase 6**: Memory, caching, long-term context, and evaluation frameworks
