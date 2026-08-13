# Inference Scheduler Architecture (Phase 17)

Overview
- The Inference Scheduler coordinates when and where inference jobs run. It is model-agnostic and does not execute model inference.
- Core responsibilities: queuing, prioritization, resource reservation, dispatch, retries, cancellation, progress reporting, and event emission.

Core components
- `JobQueue` — priority + scheduled jobs (FIFO with priority; scheduledAt support).
- `JobManager` — persistent-in-memory job records (JobRecord lifecycle).
- `PriorityManager` — configurable priority map (engine/capability → numeric priority).
- `ResourceScheduler` — adapters to `core/runtime/ResourceManager` to reserve/release resources.
- `RetryManager` — retry/backoff policy implementation.
- `CancellationManager` — lightweight cancellation tokens and cleanup.
- `ProgressTracker` — emits `JobProgress` events.
- `InferenceScheduler` — dispatch loop, handler registration, public API.

Events
- Emitted via `core/scheduler/events.ts` (`schedulerEvents`): `JobQueued`, `JobStarted`, `JobProgress`, `JobCompleted`, `JobCancelled`, `JobFailed`, `ResourceAllocated`, `ResourceReleased`, `SchedulerStarted`, `SchedulerStopped`.

Public API (basic)
- `new InferenceScheduler(handler?: JobHandler)` — create scheduler; handler executes jobs.
- `start()` / `stop()` — control loop.
- `submit(jobRequest)` — enqueue job.
- `registerHandler(handler)` — provide job executor.
- `cancelJob(jobId)` — cancel job.
- `listJobs()` / `inspectQueue()` — diagnostics.

Error recovery
- Scheduler keeps loop alive on internal errors and emits `JobFailed` with failure reasons.
- Resource reservation failures cause requeueing with delay/backoff.
- Timeouts and cancellations set job status accordingly and release resources.

Scalability & future work
- Current implementation is single-process, in-memory. Future work:
  - Persist job queue / records to durable store (Redis, Postgres) for fault tolerance.
  - Add multi-worker / distributed coordination (leader election + work-stealing).
  - Integrate GPU-aware resource accounting and reservation through enhanced `ResourceManager`.
  - Add pluggable scheduling policies (fairness, strict priorities, rate-limiting).

Location
- Implementation: `core/scheduler/`
