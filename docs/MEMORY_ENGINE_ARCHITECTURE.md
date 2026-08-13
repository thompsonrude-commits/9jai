# Memory Engine — Architecture (Phase 21)

This document describes the Memory Engine introduced in Phase 21. It is model-agnostic and integrates only with the AI Orchestrator.

Components

- `SessionMemoryManager` — temporary session-scoped memory for active conversations.
- `LongTermMemoryManager` — persistent user-scoped memory store.
- `RetrievalManager` — semantic + recency search using deterministic embeddings (in-memory reference).
- `ConsolidationManager` — summarization and deduplication helpers.
- `ForgettingManager` — expiration and deletion utilities.
- `PrivacyLayer` — ownership checks and encryption hooks.
- `MemoryEngine` — public API surface (`saveMemory`, `searchMemories`, `listMemories`, etc.).

Design Notes

- The reference implementation is in-memory and intended to be swapped for durable stores (Redis/Postgres/Vector DB) in production.
- Privacy and ownership checks are enforced via `PrivacyLayer` hooks.
- Retrieval uses a simple deterministic embedder for local testing; replace with production embeddings + vector DB for scale.

Integration

- The Memory Engine exposes an API consumable by the AI Orchestrator and Language Engine through adapters.

Files

- `core/memory/*` — source code for the engine
- `docs/MEMORY_ENGINE_ARCHITECTURE.md` — this document

Limitations

- In-memory store not suitable for production scale.
- No encryption at rest implemented (hook exists).
- No durable audit log; implement DB-backed audit for compliance.
