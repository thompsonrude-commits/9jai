# Inference Scheduler

This directory contains a production-oriented Inference Scheduler skeleton. It manages job queuing, prioritization, resource reservation (via the `core/runtime/ResourceManager`), retries, cancellation, and progress reporting. The scheduler intentionally does not perform model inference — it coordinates execution.

Key modules:

- `JobQueue` — priority + scheduled job queue
- `JobManager` — tracks job records and lifecycle
- `PriorityManager` — configurable priority map
- `ResourceScheduler` — reserves/releases resources using runtime `ResourceManager`
- `RetryManager` — backoff/retry policies
- `CancellationManager` — cancellation tokens
- `ProgressTracker` — emits progress events
- `index.ts` — `InferenceScheduler` class that runs the dispatch loop

Usage:

1. Create an `InferenceScheduler`, register a `JobHandler` that executes work, then call `start()`.
2. Submit jobs with `submit()`.

The scheduler exposes events via `schedulerEvents` (`core/scheduler/events.ts`).
