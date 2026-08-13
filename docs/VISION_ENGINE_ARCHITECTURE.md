# Vision Engine — Architecture (Phase 22)

This document describes the Vision Engine introduced in Phase 22. It focuses on visual understanding and is model-agnostic.

Components

- `ImageAnalyzer` — produces structured descriptions and detected objects.
- `ObjectDetector` — multi-object detection with bounding boxes.
- `SceneAnalyzer` — extracts scene-level metadata.
- `RelationshipAnalyzer` — computes object relationships.
- `ImageClassifier` — configurable category classification.
- `ImageComparator` — comparison utilities across images.
- `VisualQuestionInterface` — provides answers to targeted visual queries.
- `ConfidenceManager` — aggregates confidence scores.
- `MetadataGenerator` — standardized metadata for images.
- `VisionEngine` — public API for orchestrator integration.

Design Notes

- The engine returns structured metadata and never generates freeform assistant responses.
- All heavy model integrations are left as pluggable adapters.
- The reference implementation is deterministic and in-memory for testing.
