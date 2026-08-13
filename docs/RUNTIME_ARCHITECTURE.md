# Model Runtime Architecture

This document describes the architecture, components, and public API for the Model Runtime implemented in `core/runtime/`.

## Overview

The Model Runtime acts as the execution substrate for all AI models. It manages model discovery, registration, loading/unloading, lifecycle operations, capability reporting, and health/resource monitoring. It does not execute inference itself.

## Components

- `ModelRegistry` — canonical store of installed models and metadata.
- `ModelLoader` — safe load/unload lifecycle operations; prevents duplicate loads.
- `LifecycleManager` — high-level install/activate/deactivate/update/rollback operations.
- `ConfigManager` — externalized JSON-based configuration with persistence.
- `ResourceManager` — lightweight OS-based resource estimations and reservation API (placeholder for GPU-aware manager).
- `HealthMonitor` — periodic health snapshots derived from ResourceManager and process metrics.
- `CapabilityManager` — dynamic capability registration for each model.
- `VersionManager` — interface for version listing and rollback operations.
- `ModelRuntimeAPI` — public, strongly-typed runtime API consumed by the Orchestrator.
- `runtimeEvents` — event bus for platform instrumentation.

## Public API

See `core/runtime/runtimeAPI.ts` for the TypeScript interface. Key methods:

- `registerModel(meta)`
- `loadModel(modelId)`
- `unloadModel(modelId)`
- `listInstalledModels()`
- `getModelStatus(modelId)`
- `activateModel(modelId)`
- `deactivateModel(modelId)`
- `updateModel(modelId, patch)`
- `rollbackModel(modelId, version)`
- `getRuntimeHealth()`
- `getResourceUsage()`
- `onEvent(type, handler)`

## Events

The runtime emits typed events through `core/runtime/events.ts`. Examples:
- `ModelRegistered`
- `ModelLoaded`
- `ModelUnloaded`
- `ModelActivated`
- `ModelUpdated`
- `ModelFailed`
- `RuntimeStarted`
- `RuntimeStopped`

## Extension Strategy

All components are implemented as small, composable classes which can be replaced with production-ready implementations (e.g., GPU-aware ResourceManager, a persistent ModelRegistry backed by a DB, or a ModelLoader that integrates with containerized model servers).
