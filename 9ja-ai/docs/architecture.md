# 9JA AI Core Architecture

## Why this architecture exists

The 9JA AI platform is being introduced as a modular foundation that decouples the product experience from direct dependence on commercial inference providers. The goal is to move toward self-hosted, open-weight model execution while preserving the current Android experience.

## Core responsibilities

- AI Orchestrator: receives requests, determines routing, handles retries, and generates standardized responses.
- Inference Engine: manages model loading, health checks, resource allocation, and queued execution.
- Engine adapters: provide capability-specific interfaces for language, vision, image, video, speech, translation, memory, and OCR workflows.
- Model Manager and Registry: track model metadata and runtime availability.

## Request flow

1. The Android app or another upstream consumer sends an AI request to the platform boundary.
2. The orchestrator classifies the request and routes it to the correct engine.
3. The inference engine selects an available model, prepares the runtime, and executes the job.
4. The engine returns a standardized response object for the caller.

## Model lifecycle

- Register models with the model manager.
- Load the model into the inference engine when it becomes eligible.
- Perform health checks before execution.
- Evict or swap models when capacity changes.

## Folder purpose

- 9ja-ai-core/orchestrator: request intake and routing.
- 9ja-ai-core/inference: execution and queueing.
- 9ja-ai-core/engines: capability-specific interfaces.
- 9ja-ai-core/model-manager: model registration and selection.
- ai-lab: non-production research and experimentation.

## Coding conventions

- Keep interfaces explicit and capability-based.
- Preserve TODO markers for future implementation work.
- Avoid introducing business logic into the scaffold.
- Favor modularity over coupling.

## Future expansion strategy

This scaffold is the first step in a phased migration. The next stages will progressively move chat, vision, OCR, image generation, video generation, translation, and speech workflows into the core architecture without disrupting the current application.
