# AI Orchestrator Architecture (Phase 18)

Overview
- The AI Orchestrator is the single gateway for all AI requests. It validates requests, detects intent, resolves capabilities, coordinates workflows across engines, communicates with the Model Runtime and Inference Scheduler, aggregates responses, streams partial outputs, and records audit telemetry.

Components
- `RequestGateway` — request validation and normalization
- `IntentAnalyzer` — lightweight intent detection (pluggable)
- `CapabilityResolver` — consults `core/capabilities/CapabilityRegistry`
- `WorkflowCoordinator` — constructs configurable pipelines across capabilities
- `ContextManager` — per-session context storage
- `ResponseAggregator` — merges engine outputs
- `StreamingManager` — emits response chunks/events
- `ErrorCoordinator` — standardized error responses
- `Audit` — lightweight audit trail
- `Scheduler Integration` — communicates with `core/scheduler/InferenceScheduler`

Extensibility
- Register engine adapters via `AIOrchestrator.registerAdapter()` to integrate engines without modifying orchestrator internals.

Notes
- The current implementation is a reference scaffolding. It intentionally avoids model-specific logic and engine implementations. Production work should add durable session stores, capability registry population, security hooks, and robust streaming/adapters.
