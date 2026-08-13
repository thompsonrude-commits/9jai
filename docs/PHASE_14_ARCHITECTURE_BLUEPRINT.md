# Phase 14 — 9JA AI Architecture Blueprint for Technical Review

## Table of Contents

1. Executive Summary
2. Current Project Status
3. System Architecture
4. Folder Structure
5. AI Core Modules
6. AI Technology Stack
7. Nigerian Language Intelligence Engine (NLIE)
8. Model Runtime
9. AI Lab
10. Hardware Strategy
11. Deployment Strategy
12. Security
13. Licensing Review
14. Risks and Trade-offs
15. Implementation Roadmap
16. Outstanding Questions

---

## 1. Executive Summary

9JA AI is being designed as an independent, African-language-first AI platform rather than as a thin client application layered over third-party inference APIs. The platform’s long-term goal is to become a self-controlled AI stack that can power Android, web, desktop, iOS, enterprise, and API-driven applications from a single core architecture.

The architectural philosophy is built around five principles:

- Provider-agnostic AI orchestration
- Open-weight-first model strategy
- Modular capability engines
- African-language-first intelligence
- Long-term maintainability and portability

The current design positions 9JA AI Core as the permanent control layer. Applications, including the Android client, are expected to interact with the Core through stable interfaces rather than directly with model vendors or proprietary APIs.

This blueprint documents the architecture that has been established so far, the components that currently exist, and the gaps that require future validation before implementation proceeds.

---

## 2. Current Project Status

### Completed architectural work

The project already contains a substantial architectural foundation for a provider-agnostic AI platform:

- A core AI architecture under the core directory
- An orchestrator-based request flow
- A modular engine structure for language, vision, image, video, speech, translation, memory, and OCR
- A dedicated AI Lab for research, evaluation, and experimentation
- A documented separation between application logic and AI core services

### Existing modules and responsibilities

The current repository already shows the following major architectural layers:

- Frontend application in the src directory
- Backend and deployment configuration in the backend and functions directories
- AI core services in core
- AI research and model experimentation in ai-lab

### Existing folder structure summary

The repository is organized into application code, AI core code, backend infrastructure, and research assets. The architecture is already structured around a clear separation of concerns.

### Remaining work

The remaining work is not implementation of the full AI stack itself, but rather:

- Formalizing the architecture into a review-ready blueprint
- Clarifying runtime, deployment, licensing, and operational decisions
- Defining the implementation order for the runtime and engines
- Resolving outstanding questions before production implementation begins

---

## 3. System Architecture

### 3.1 High-level architecture

The 9JA AI platform is organized as a layered system:

1. Client layer
   - Android application
   - Future web, desktop, and mobile clients

2. Application services layer
   - Authentication, routing, user services, and app-specific workflows

3. AI Core layer
   - AI Orchestrator
   - Capability engines
   - Model Runtime
   - Logging and configuration

4. Data and memory layer
   - Vector memory
   - Structured memory
   - Retrieval services

5. AI Lab layer
   - Benchmarks
   - Datasets
   - Model evaluation
   - Experiments

6. Infrastructure layer
   - Local, cloud, and on-prem deployment paths

### 3.2 Architectural intent

The Android app is not intended to know which model powers a given capability. It should send requests to the core architecture and receive normalized responses. This keeps the UI stable even if the model runtime changes underneath.

### 3.3 Core request flow

A typical AI request flows as follows:

1. The application sends a request to the AI Core entry point.
2. The AI Orchestrator inspects the request type and selects the appropriate engine.
3. The selected engine executes its task using an abstracted runtime interface.
4. The runtime resolves the most appropriate model or execution path.
5. The response is normalized and returned to the application.

### 3.4 Architecture diagram

```text
Client Apps
  └── AI Core API / Orchestrator
        ├── Language Engine
        ├── Vision Engine
        ├── OCR Engine
        ├── Image Engine
        ├── Video Engine
        ├── Speech Engine
        ├── Memory Engine
        └── Translation / NLIE
              └── Model Runtime / Model Registry / Inference Backend
```

### 3.5 Data flow

The data flow is intentionally layered:

- User-facing input enters through the app or API layer.
- Requests are normalized by the Core.
- The orchestrator routes them to the proper engine.
- The engine interacts with the runtime and memory services.
- Outputs are returned in a consistent format.

This design supports future migration between model families without breaking application contracts.

---

## 4. Folder Structure

The repository already reflects the intended platform architecture.

```text
9JA AI Project
├── ai-lab/
│   ├── benchmarks/
│   ├── datasets/
│   ├── evaluation/
│   ├── experiments/
│   ├── models/
│   ├── research/
│   └── training/
├── backend/
├── core/
│   ├── api/
│   ├── cache/
│   ├── config/
│   ├── engines/
│   │   ├── image/
│   │   ├── language/
│   │   ├── memory/
│   │   ├── ocr/
│   │   ├── speech/
│   │   ├── translation/
│   │   ├── video/
│   │   └── vision/
│   ├── logging/
│   ├── models/
│   ├── orchestrator/
│   ├── providers/
│   ├── services/
│   ├── utils/
│   └── README.md
├── docs/
├── functions/
├── public/
├── scripts/
├── src/
│   ├── components/
│   ├── lib/
│   └── main.tsx
└── package.json
```

### Folder purpose summary

- ai-lab: research, model evaluation, fine-tuning, data management, and benchmark workflows
- backend: server-side infrastructure and deployment-facing services
- core: the central AI architecture and engine abstractions
- docs: technical and product documentation
- functions: cloud function and backend automation code
- public: static assets and web platform assets
- scripts: automation and validation scripts
- src: frontend application and UI layer

---

## 5. AI Core Modules

### 5.1 AI Orchestrator

**Purpose**

The AI Orchestrator is the central routing component for all AI requests.

**Responsibilities**

- Receive normalized AI requests
- Determine the appropriate engine
- Route tasks across capabilities
- Aggregate responses when required
- Enforce runtime-level policy and fallback behavior

**Interfaces**

The orchestrator should expose a stable request contract to the application layer and route to engine-specific execution contracts.

**Dependencies**

- Engine registry
- Runtime interface
- Configuration services
- Logging services

**Future expansion**

The orchestrator should eventually support multi-engine workflows, high-priority routing, and distributed execution.

### 5.2 Model Runtime

**Purpose**

The Model Runtime is the execution layer that loads and serves models behind the engine abstraction.

**Responsibilities**

- Discover models
- Load and unload models
- Monitor health
- Allocate resources
- Report benchmarks and latency
- Enable hot swapping and rollback

**Dependencies**

- Model registry
- Inference backend adapters
- Resource management
- Health monitoring services

**Future expansion**

The runtime is expected to grow into a distributed inference system with GPU-aware routing.

### 5.3 Language Engine

**Purpose**

The Language Engine handles core language intelligence tasks such as chat, reasoning, summarization, and instruction following.

**Responsibilities**

- Generation and reasoning
- Summarization
- Writing assistance
- Instruction following
- Conversation management

**Dependencies**

- Model runtime
- Memory engine
- Configuration and logging

### 5.4 Vision Engine

**Purpose**

The Vision Engine handles visual understanding and multimodal perception.

**Responsibilities**

- Image understanding
- Scene analysis
- Object and concept recognition
- Multi-image comparison

**Dependencies**

- Model runtime
- OCR engine for text-heavy image tasks

### 5.5 OCR Engine

**Purpose**

The OCR Engine handles text extraction from visual documents and structured media.

**Responsibilities**

- Printed text recognition
- Handwriting extraction
- Form and receipt parsing
- Layout-aware document processing

**Dependencies**

- Vision runtime
- Image preprocessing utilities

### 5.6 Image Engine

**Purpose**

The Image Engine handles generation and editing workflows.

**Responsibilities**

- Text-to-image generation
- Image editing
- Inpainting and outpainting
- Background removal and style transfer

**Dependencies**

- Model runtime
- Image prompt and output handling services

### 5.7 Video Engine

**Purpose**

The Video Engine handles motion generation and video editing workflows.

**Responsibilities**

- Text-to-video
- Image-to-video
- Frame interpolation
- Editing support

**Dependencies**

- Model runtime
- Storage for intermediate results

### 5.8 Speech Engine

**Purpose**

The Speech Engine covers speech recognition and text-to-speech.

**Responsibilities**

- Speech-to-text
- Streaming transcription
- Text-to-speech generation
- Voice response orchestration

**Dependencies**

- Model runtime
- Audio preprocessing utilities

### 5.9 Memory Engine

**Purpose**

The Memory Engine handles context retention and retrieval for long-running interactions.

**Responsibilities**

- Short-term memory
- Long-term memory
- User profile memory
- Semantic retrieval

**Dependencies**

- Vector store
- Embeddings
- Retrieval services

### 5.10 Translation Engine

**Purpose**

The Translation Engine focuses on cross-language translation and language routing.

**Responsibilities**

- Translation between languages
- Language detection
- Cross-language retrieval support

**Dependencies**

- NLIE language resources
- Runtime model access

### 5.11 Nigerian Language Intelligence Engine (NLIE)

**Purpose**

NLIE is the specialized architecture for Nigerian languages and African multilingual intelligence.

**Responsibilities**

- Translation
- Dialect handling
- Slang and colloquial processing
- Proverbs and cultural expressions
- Grammar and spell support
- Speech and TTS support
- Cross-language search and language learning

**Dependencies**

- Language data modules
- Model runtime
- Translation and speech engines

### 5.12 Logging

**Purpose**

Logging provides observability for runtime behavior, failures, and model execution events.

**Responsibilities**

- Structured logging
- Performance assessment
- Debugging and diagnostics

### 5.13 Configuration

**Purpose**

Configuration centralizes runtime defaults, model preferences, storage, security settings, and deployment settings.

**Dependencies**

- Environment variables
- Runtime policy files
- Deployment manifests

### 5.14 Storage

**Purpose**

Storage provides persistence for memory, caching, evaluation artifacts, and deployment state.

**Dependencies**

- Vector database
- Structured storage
- Cached responses

### 5.15 Utilities

**Purpose**

Utilities support shared formatting, validation, parsing, and cross-cutting functionality across the core.

---

## 6. AI Technology Stack

This section documents the open-weight-based technology strategy for the platform.

### 6.1 Language models

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Language intelligence | Qwen2.5 72B Instruct | Llama 3.1 70B Instruct | Strong instruction following, reasoning, coding, multilingual support |

**Strengths**

- Strong reasoning and instruction following
- Good multilingual and coding support
- Suitable for a broad range of AI assistant tasks

**Weaknesses**

- Higher GPU demand
- Requires careful serving and quantization strategy

**Hardware requirements**

- Small deployments: single modern GPU
- Larger deployments: multi-GPU server

**License**

- Must be reviewed before commercial deployment

### 6.2 Vision models

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Vision intelligence | Qwen2-VL 72B | InternVL2.5 / LLaVA-NeXT 34B | Strong multimodal reasoning and general visual understanding |

### 6.3 OCR

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| OCR | PaddleOCR + PP-StructureV2 | Surya OCR + DocTR | Strong document structure and layout handling |

### 6.4 Image generation

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Image generation/editing | SDXL-based pipeline with ControlNet/IP-Adapter | PixArt-Σ | Mature open-weight image pipeline with editing support |

### 6.5 Video generation

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Video generation | CogVideoX-5B | Open-Sora 1.2 | Open-weight video generation with strong future potential |

### 6.6 Speech recognition

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Speech-to-text | Whisper Large-v3 | Distil-Whisper | Strong multilingual speech recognition and robustness |

### 6.7 Text-to-speech

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Text-to-speech | XTTS v2 | MeloTTS / Parler-TTS | Natural speech synthesis with multilingual expansion potential |

### 6.8 Embedding models

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Embeddings | BGE-M3 | Nomic Embed Text v1.5 | Strong retrieval and multilingual support |

### 6.9 Vector database

| Capability | Primary recommendation | Backup recommendation | Why selected |
| --- | --- | --- | --- |
| Vector database | Qdrant | Milvus | High-performance open-source retrieval and memory indexing |

---

## 7. Nigerian Language Intelligence Engine (NLIE)

### 7.1 Vision

NLIE is intended to be one of the defining technical features of 9JA AI. It is not merely a translation subsystem; it is a multilingual intelligence framework for Nigerian languages and other African languages.

### 7.2 Architecture

NLIE should be implemented as a modular language framework with the following layers:

1. Language registry
2. Shared linguistic core
3. Capability adapters
4. Data layer
5. Model layer
6. Runtime layer

This design allows the platform to support new languages without redesigning the core engine.

### 7.3 Supported capabilities

The engine should eventually support:

- Translation
- Dialect detection
- Accent handling
- Slang and local expressions
- Proverbs and cultural context
- Grammar correction
- Spell checking
- Speech recognition
- Text-to-speech
- Language learning
- Cross-language search

### 7.4 Expansion strategy

The architecture is designed to support all Nigerian languages as sufficient linguistic resources become available. The proposed first-wave languages are:

- Nigerian Pidgin
- Yoruba
- Hausa
- Igbo
- Edo (Bini)
- Fulfulde
- Kanuri
- Tiv
- Ibibio
- Efik
- Urhobo
- Itsekiri
- Isoko
- Ijaw
- Nupe
- Gbagyi (Gwari)
- Ebira
- Idoma
- Igala
- Bachama
- Jukun
- Berom
- Eggon
- Goemai
- Tangale
- Mwaghavul
- Kuteb

### 7.5 Plugin-based language architecture

Language support should be implemented through modular language profiles. Each profile can include:

- Orthography and script rules
- Dialect variants
- Vocabulary resources
- Grammar rules
- Tone or pronunciation behavior
- Speech resources
- Cultural context data

This allows new language modules to be added without changing the orchestrator or runtime interfaces.

---

## 8. Model Runtime

### 8.1 Goals

The Model Runtime must be provider-agnostic and support future model diversity.

### 8.2 Responsibilities

- Model discovery
- Dynamic loading
- Versioning
- Health monitoring
- Benchmarking
- Rollback
- Resource allocation
- Multi-model execution
- GPU scheduling
- Distributed inference roadmap

### 8.3 Proposed runtime architecture

The runtime should consist of:

- A model registry
- A runtime adapter layer
- An inference server layer
- A scheduling and resource manager
- A benchmarking and health monitor

### 8.4 Runtime design principle

The application should not directly select a model. The Orchestrator should select the capability path and the runtime should resolve the best execution backend.

### 8.5 Future roadmap

The runtime should eventually support multi-node, multi-GPU deployment with failover and automatic model selection.

---

## 9. AI Lab

The AI Lab is the research and experimentation environment for the platform.

### 9.1 Purpose

The AI Lab supports:

- Dataset curation
- Fine-tuning workflow experiments
- Model evaluation
- Benchmarking
- Research notes and experiments

### 9.2 Existing structure

The current directory structure already reflects the intended usage:

- datasets for raw and processed data
- training for fine-tuning scripts
- evaluation for evaluation harnesses
- benchmarks for benchmark suites
- experiments for exploratory work
- research for findings and notes
- models for model artifacts

### 9.3 Future Model Evaluation Framework

A formal evaluation framework should eventually track:

- Accuracy
- Latency
- Memory usage
- Throughput
- Behavioral quality
- Language coverage

This framework will become the basis for deciding which models are promoted into production.

---

## 10. Hardware Strategy

### 10.1 Development environment

A suitable development setup should include:

- Modern multi-core CPU
- 32GB+ RAM
- 1TB NVMe SSD
- Optional but strongly recommended GPU

### 10.2 CPU-only testing

CPU-only environments are useful for:

- Smoke tests
- Unit and integration tests
- Lightweight evaluation
- Non-latency-critical tasks

### 10.3 Single-GPU deployment

A single modern GPU is appropriate for:

- Small and mid-sized inference workloads
- Local experimentation
- Early-stage production

### 10.4 Multi-GPU deployment

Multi-GPU servers are appropriate for:

- Larger language models
- Concurrent image or video generation
- High-throughput inference

### 10.5 Enterprise deployment

Enterprise deployment should be based on dedicated GPU pools and isolated serving nodes.

### 10.6 Estimated hardware profile

| Environment | CPU | GPU | RAM | Storage |
| --- | --- | --- | --- | --- |
| Development laptop/workstation | Modern multi-core | Optional | 32GB+ | 1TB NVMe |
| Single-GPU inference node | Multi-core server | 1 x modern GPU | 64GB+ | 1TB+ |
| Multi-GPU inference node | Server-grade CPU | 2–4 GPUs | 128GB+ | 2TB+ |
| Enterprise cluster | Multiple servers | GPU pool | 256GB+ | High-throughput storage |

---

## 11. Deployment Strategy

### 11.1 Local deployment

Local deployment is appropriate for development, debugging, and offline experimentation.

### 11.2 Cloud deployment

Cloud deployment is appropriate for production, scaling, and burst demand.

### 11.3 On-premises deployment

On-prem deployment is appropriate for enterprise privacy-sensitive or regulated deployments.

### 11.4 Hybrid deployment

A hybrid model is likely the most practical long-term approach:

- Keep local memory and lightweight retrieval close to the application
- Route heavier inference workloads to GPU-backed cloud or on-prem infrastructure

### 11.5 Scalability direction

The platform should scale from developer workstations to GPU clusters without changing the external application contract.

---

## 12. Security

### 12.1 Authentication and authorization

The application should continue to rely on established identity and access controls for user and admin access.

### 12.2 API security

AI endpoints should enforce proper authentication, rate control, and request validation.

### 12.3 Encryption

Sensitive data should be encrypted in transit and, where appropriate, at rest.

### 12.4 User privacy

User data used for memory or personalization should be treated with strong privacy protections. The architecture should make it easy to disable or limit memory retention where required.

### 12.5 Model isolation

The runtime should support independent model execution contexts where necessary to reduce cross-tenant or cross-workload risk.

### 12.6 Logging strategy

Logs should capture operational telemetry without exposing secrets. Logging should be structured and auditable.

---

## 13. Licensing Review

### 13.1 General licensing posture

The platform should prefer models and components with clear licensing terms and strong commercial viability. Open-weight solutions are preferred, but every adopted dependency must still be reviewed before production rollout.

### 13.2 Licensing concerns by component

- Language models: review redistribution and derivative-use obligations.
- Vision and multimodal models: review model license terms and packaging obligations.
- Image and video models: review licensing variability and any restrictions on commercial deployment.
- Speech and voice systems: review voice data rights and cloning restrictions.
- Vector database and embeddings: review package licensing and hosting obligations.

### 13.3 Risk summary

The biggest licensing risk is not the presence of open-weight models, but the assumption that all open-weight models are equally safe for unrestricted commercial deployment. Legal review is required at model selection time.

---

## 14. Risks and Trade-offs

### Technical risks

- Model runtime complexity may grow quickly.
- Runtime and engine interfaces must remain stable as the stack evolves.
- Multi-model execution may complicate observability.

### Scalability risks

- Larger models increase latency and hardware costs.
- Video generation is especially expensive and should remain a special-case path.

### Hardware risks

- GPU availability can become a bottleneck.
- Development environments may not reflect production hardware behavior.

### Operational risks

- Model version drift can introduce regressions.
- Benchmarking and evaluation must be kept current to avoid silent quality loss.

### Model maturity concerns

- Some open-weight video and multilingual models are still maturing.
- Nigerian-language resources remain uneven across languages.

### Validation needs

The architecture should be validated through benchmark runs, pilot deployments, and review by experienced AI and infrastructure engineers.

---

## 15. Implementation Roadmap

The recommended implementation order is as follows:

1. Model Runtime
   - Establish the runtime abstraction and model registry.

2. AI Orchestrator
   - Make the orchestrator the single routing layer for capability requests.

3. Language Engine
   - Deliver core language intelligence first because it serves as the foundation for many other capabilities.

4. Vision Engine
   - Add visual understanding and multimodal support.

5. OCR Engine
   - Add document and image-text extraction.

6. Speech Engine
   - Add recognition and speech synthesis.

7. Nigerian Language Intelligence Engine (NLIE)
   - Build the language framework and expand support incrementally.

8. Memory Engine
   - Add retrieval and memory services once the runtime and embeddings are available.

9. Image Engine
   - Add generation and editing workflows.

10. Video Engine
   - Add video as a higher-cost, more specialized capability.

11. Android App Migration
   - Move the app to use the Core API rather than direct provider logic.

12. Optimization
   - Tune quality, latency, cost, and reliability after the platform is functional.

13. Production Deployment
   - Roll out under controlled infrastructure and observability.

### Why this order is recommended

This order prioritizes the runtime and orchestration layer first, then the core capabilities that are most foundational, and finally the higher-cost media engines. It also allows the Nigerian-language engine to mature alongside the broader core platform.

---

## 16. Outstanding Questions

The following architectural decisions still require validation or approval before implementation begins:

1. Which runtime stack will be used for the first production deployment?
2. Which exact language model family will be selected for the initial deployment baseline?
3. Which vision and OCR stack will be used for early production validation?
4. Which open-weight image pipeline is acceptable under the project’s licensing goals?
5. Which deployment topology will be used for development, staging, and production?
6. Which hardware profile will be used for the first live deployment?
7. Which evaluation framework will govern model acceptance into production?
8. How will multilingual and Nigerian-language data be sourced and licensed?
9. How will memory and vector storage be governed from a privacy standpoint?
10. What level of on-prem capability is required for the first enterprise rollout?

These questions must be resolved before implementation proceeds.

---

## 17. Phase 15 — Final Refinement Summary (Added)

During the final architecture refinement (Phase 15) the following non-implementation refinements were applied to strengthen the platform prior to production work. These refinements are additive and maintain backward compatibility with existing clients and app-facing contracts.

- Runtime-centric naming and structure: the legacy "providers" concept has been replaced by a runtime-centric model layer (`Model Runtime`) and supporting runtime files under `core/runtime/`.
- Inference Scheduler: a dedicated scheduler coordinates job queueing, priorities, GPU allocation, retries, cancellations, timeouts, and batching. It is a traffic controller, not an executor.
- Capability Registry: engines register capabilities dynamically and the Orchestrator queries the registry instead of relying on hard-coded engine branches.
- Knowledge Engine: a retrieval-oriented Knowledge Engine was introduced for RAG, document indexing, semantic search, and multi-document reasoning.
- Observability Layer: structured metrics, tracing, GPU monitoring, health checks, and centralized error reporting were added as a first-class platform component.
- Model Evaluation Framework (AI Lab): the AI Lab now formalizes model acceptance testing with measurable criteria (accuracy, hallucination rate, latency, GPU usage, language coverage, safety, etc.). Only models meeting thresholds are promoted for production consideration.
- Plugin SDK: a plugin lifecycle and registration strategy enables third-party or internal engines (domain-specific engines) to be added without changing core orchestrator logic.

These changes were documented and lightweight reference implementations were added under `core/` to make the architecture concrete for implementation planning. No model binaries or inference integrations were introduced in this phase.

### Backward compatibility

- The Android app and all external clients continue to communicate only with the AI Orchestrator API.
- The Orchestrator continues to expose the same request/response contract; internally it now consults the Capability Registry, Scheduler, and Model Runtime.
- No user-facing API changes were made.

A compatibility report summarizing these points and any minor migration notes is available in [PHASE_15_COMPATIBILITY_REPORT.md](PHASE_15_COMPATIBILITY_REPORT.md).

## Conclusion

The current 9JA AI architecture remains coherent and strategically aligned with the project’s long-term goals. Phase 15 refinements improve modularity, scalability, and observability while keeping the platform ready for a controlled implementation phase. Several runtime, licensing, deployment, and data-governance decisions still require formal approval before production rollout.
