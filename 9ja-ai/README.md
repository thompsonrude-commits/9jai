# 9JA AI Core Platform

This directory establishes the first architectural foundation for an independent 9JA AI platform.

## Purpose

- Preserve the existing Android application experience.
- Introduce a dedicated 9JA AI Core layer.
- Prepare the platform for open-weight models and self-hosted inference in the future.

## Structure

- app/: boundary for the Android product experience
- 9ja-ai-core/: orchestration, inference, engine abstractions, services, and configuration
- ai-lab/: non-production research and experimentation space
- backend/: future platform services and APIs
- docs/: architecture, migration, and operating guidance

## Guiding Principles

- No direct provider coupling in the application layer.
- Modular engine interfaces for language, vision, image, video, speech, translation, memory, and OCR.
- Clear separation between production runtime code and AI research work.

## Next Phase

The scaffold in this folder is intentionally architectural and non-invasive. Existing product features remain unchanged while the platform foundation is established.
