# Language Engine — Architecture (Phase 20)

This document describes the `Language Engine` introduced in Phase 20. It is model-agnostic and integrates only with the AI Orchestrator.

Components

- `ConversationManager` — multi-turn conversation state and summary.
- `PromptBuilder` — templated prompt assembly from request, conversation, memory, and knowledge.
- `ResponseGenerator` — formats outputs (text, markdown, json) and supports streaming.
- `ReasoningManager` — task decomposition and step evaluation hooks.
- `Adapters` — `MemoryAdapter`, `KnowledgeAdapter`, and `ToolInvoker` interfaces for integration.
- `LanguageEngine` — top-level orchestrator for language work within the engine boundaries (does not schedule inference or load models).

Design Notes

- The engine is strictly model-agnostic — it does not implement inference or integrate providers.
- All external calls (memory, knowledge, tools) are through adapter interfaces so implementations may be swapped.
- Conversation state is kept in-memory by default but the `ConversationManager` can be replaced with a persistent implementation by passing it to `LanguageEngine` constructor.

Sequence

1. Orchestrator → `LanguageEngine.handleRequest()`
2. `ConversationManager` records the user turn
3. `MemoryAdapter` and `KnowledgeAdapter` retrieve context
4. `PromptBuilder` assembles prompt
5. `ReasoningManager` optionally decomposes tasks
6. `ResponseGenerator` formats the output
7. `ConversationManager` records assistant turn and returns response

Files

- `core/language/*` — source code for the engine
- `docs/LANGUAGE_ENGINE_ARCHITECTURE.md` — this document

Limitations

- In-memory defaults are for reference only. Use durable backends in production.
- Reasoning and generation are lightweight placeholders; pluggable hooks exist for future model and reasoning integrations.
