# Phase 13 — Official 9JA AI Technology Stack Blueprint

## Purpose

This document defines the official technology stack for 9JA AI Version 1.

It is the permanent technical constitution for the platform. Every future implementation of the AI Orchestrator, Model Runtime, Language Engine, Vision Engine, OCR Engine, Image Engine, Video Engine, Speech Engine, Memory Engine, and Nigerian Language Intelligence Engine must follow this blueprint.

This phase is architectural only. No production implementation, model integration, or commercial API connection is performed here.

---

## 1. Strategic Principles

9JA AI will be built as an independent AI platform, not as a thin wrapper over third-party AI services.

### Core design principles

- Open-weight first
- Provider-agnostic by design
- Self-hosted ready
- Modular and extensible
- African-language first
- Commercially viable and license-safe
- Hardware-efficient and scalable
- Suitable for local, cloud, and on-prem deployment

### Non-goals for Version 1

- No dependency on proprietary inference APIs as the primary path
- No hard-coded model vendor lock-in
- No fixed-language assumptions in the Nigerian language stack
- No fake or simulated intelligence

---

## 2. Official Version 1 AI Stack Overview

The official Version 1 platform will consist of the following layers:

1. Application layer
   - Android app
   - Web app
   - Desktop app
   - Enterprise APIs

2. Core orchestration layer
   - 9JA AI Core
   - AI Orchestrator
   - Capability engines
   - Runtime abstraction

3. Model layer
   - Open-weight models for language, vision, OCR, image, video, speech, and embeddings

4. Data and memory layer
   - Structured memory store
   - Vector memory store
   - Retrieval and semantic search

5. Inference runtime layer
   - Model discovery
   - Health monitoring
   - Load balancing
   - Scheduling
   - Versioning

6. Infrastructure layer
   - Local development
   - GPU deployment
   - Cloud deployment
   - On-prem deployment

---

## 3. Recommended Stack by Capability

| Capability | Primary recommendation | Backup recommendation | Why it fits 9JA AI |
| --- | --- | --- | --- |
| Language intelligence | Qwen2.5 72B Instruct | Llama 3.1 70B Instruct | Strong instruction following, reasoning, coding, multilingual support |
| Vision intelligence | Qwen2-VL 72B | InternVL2.5 / LLaVA-NeXT 34B | Strong multimodal reasoning and image understanding |
| OCR | PaddleOCR + PP-StructureV2 | Surya OCR + DocTR | Excellent layout and document understanding |
| Image generation/editing | SDXL + ControlNet + IP-Adapter | PixArt-Σ | Mature open-weight image stack with editing support |
| Video generation | CogVideoX-5B | Open-Sora 1.2 | Strong open-weight video pipeline |
| Speech recognition | Whisper Large-v3 | Distil-Whisper | Strong multilingual and noisy speech recognition |
| Text-to-speech | XTTS v2 | MeloTTS / Parler-TTS | Natural speech with multilingual support |
| Embeddings | BGE-M3 | Nomic Embed Text v1.5 | Strong retrieval and semantic search |
| Vector DB | Qdrant | Milvus | Open-source, high-performance retrieval |
| Runtime | vLLM + TensorRT-LLM + llama.cpp | Ollama + custom orchestration | Flexible deployment from laptop to cluster |

> Note: These recommendations are intended as the official starting blueprint. They should be re-reviewed quarterly as the open-weight ecosystem evolves.

---

## 4. Language Intelligence

### Recommended models

- Primary: Qwen2.5 72B Instruct
- Backup: Llama 3.1 70B Instruct

### Purpose

Used for chat, reasoning, coding, writing, summarization, mathematics, instruction following, and long-context dialogue.

### Strengths

- Strong instruction following
- Good coding and reasoning depth
- Better multilingual support than many older open-weight baselines
- Good fit for long-context conversational workloads

### Weaknesses

- Larger models require substantial GPU memory
- Inference latency increases with long context
- Quality is still sensitive to prompt structure and retrieval context

### Hardware requirements

- CPU-only: not practical for production quality on large models
- Single GPU: feasible for quantized 7B/8B and 14B-class models
- Multi-GPU: recommended for 70B-class deployment

### GPU requirements

- 7B/8B: 1x RTX 4090 or equivalent
- 14B/32B: 1–2x L40S / A100 40GB
- 70B: 2–4x L40S / A100 80GB depending on quantization and concurrency

### RAM requirements

- 32GB minimum for development use
- 64GB+ recommended for multi-model or memory-heavy workloads

### Expected inference speed

- 7B/8B: fast interactive performance on a single modern GPU
- 70B: moderate to high latency unless quantized and aggressively optimized

### License

- Qwen2.5: permissive open-weight license with broad commercial compatibility
- Llama 3.1: commercial use is permitted under the Llama license, but the license should be reviewed carefully for redistribution and derivative deployment obligations

### Commercial-use compatibility

- Qwen is the safer default for a commercial platform
- Llama is viable but requires license review

### Long-term suitability

- High for 9JA AI because it supports multilingual and instruction-heavy workflows without vendor lock-in

---

## 5. Vision Intelligence

### Recommended architecture

- Primary: Qwen2-VL 72B
- Backup: InternVL2.5 or LLaVA-NeXT 34B

### Purpose

Used for object recognition, scene understanding, product recognition, food recognition, plant recognition, animal recognition, landmark recognition, currency recognition, and multi-image comparison.

### Strengths

- Strong multimodal reasoning
- Better grounding than simple CNN classifiers
- Good at general visual understanding and image-question answering

### Weaknesses

- Larger multimodal models are expensive
- Need careful prompt and output schema design
- Less deterministic than specialized vision classifiers for narrow tasks

### Hardware requirements

- For local experimentation: a single modern GPU
- For production: 1–2 GPUs if serving multiple concurrent requests

### GPU requirements

- 1x RTX 4090 for development or smaller workloads
- 2x L40S / A100 for sustained production traffic

### RAM requirements

- 32GB+ recommended
- 64GB for multi-model serving and caching

### Expected inference speed

- Good for batch and interactive use at moderate concurrency
- Not as fast as specialized object detectors for single-purpose tasks

### License

- Qwen-based multimodal stacks are generally permissive
- InternVL/LLaVA families are commonly used with open-weight licenses, but legal review remains necessary for commercial deployment

### Commercial-use compatibility

- Generally suitable if license review is completed before production rollout

### Long-term suitability

- High because the platform needs a flexible visual reasoning layer that can generalize beyond narrow classifiers

---

## 6. OCR Intelligence

### Recommended architecture

- Primary: PaddleOCR + PP-StructureV2 for layout-aware OCR, forms, tables, receipts, and documents
- Backup: Surya OCR + DocTR for lightweight and flexible document parsing

### Purpose

Used for printed text, handwriting, tables, forms, receipts, PDFs, complex layouts, and multilingual OCR.

### Strengths

- Very strong for printed text and document structure
- Better than generic VLM OCR for structured layout tasks
- Supports table extraction and form understanding

### Weaknesses

- Handwriting quality is still uneven compared to printed text
- Complex documents may require post-processing and layout correction

### Hardware requirements

- CPU-based inference is feasible for small document batches
- GPU improves throughput for large-scale OCR jobs

### GPU requirements

- CPU-only is acceptable for low-volume use
- 1x GPU recommended for production throughput

### RAM requirements

- 16GB minimum
- 32GB+ recommended for large batches and PDFs

### Expected inference speed

- Fast on CPU for small documents
- Much faster on GPU for larger document collections

### License

- PaddleOCR and its related tooling are widely used under permissive terms
- Surya and DocTR are generally compatible with open-weight commercial use patterns

### Commercial-use compatibility

- Good if the selected package licenses are reviewed at the distribution stage

### Long-term suitability

- High because OCR is a core utility and should remain independent from the language model stack

---

## 7. Image Intelligence

### Recommended architecture

- Primary: SDXL-based generation pipeline with ControlNet, IP-Adapter, and inpainting support
- Backup: PixArt-Σ or another high-quality open-weight image stack

### Purpose

Used for text-to-image, image-to-image, inpainting, outpainting, background removal, image expansion, image recreation, face preservation where appropriate, accurate text rendering, high-resolution generation, and style transfer.

### Strengths

- Mature ecosystem
- Strong editing support
- Good for iterative creative workflows

### Weaknesses

- Text rendering is still imperfect without specialized post-processing
- Image quality varies by prompt and refinement strategy
- Some families require careful legal review

### Hardware requirements

- Development: single modern GPU
- Production: multiple GPUs for concurrent jobs

### GPU requirements

- 1x RTX 4090 for experimentation and light production
- 2–4x GPUs for larger image pipelines or burst traffic

### RAM requirements

- 32GB+ recommended
- 64GB for multi-pipeline use

### Expected inference speed

- Good for interactive editing and batch generation when properly quantized and optimized

### License

- SDXL-family stacks may require license review depending on the exact distribution and training artifacts used
- PixArt-style stacks may provide a more permissive route but often require validation of the exact model family and packaging

### Commercial-use compatibility

- Potentially good, but legal review is mandatory before production deployment

### Long-term suitability

- High, because image tools are central to the platform experience and need to be locally controllable

---

## 8. Video Intelligence

### Recommended architecture

- Primary: CogVideoX-5B
- Backup: Open-Sora 1.2 or a future equivalent open-weight video stack

### Purpose

Used for text-to-video, image-to-video, video editing, frame interpolation, motion consistency, and animation.

### Strengths

- Open-weight video generation is advancing quickly
- Good fit for early-stage experimentation and controlled deployment

### Weaknesses

- Video generation is compute-heavy
- Quality and temporal consistency still lag behind the best commercial systems
- Long render times make it unsuitable for low-latency user experiences

### Hardware requirements

- Prototyping: strong GPU workstation
- Production: multi-GPU or clustered inference

### GPU requirements

- At least one high-end GPU for experimentation
- Multi-GPU clusters for production-quality video generation

### RAM requirements

- 64GB+ recommended for serious video work
- More if multiple jobs are queued

### Expected inference speed

- Realistically slower than image generation; often seconds to minutes depending on duration and resolution

### License

- Open-weight video stacks should be chosen with explicit license review because the ecosystem is still maturing

### Commercial-use compatibility

- Viable, but should be validated before broad deployment

### Long-term suitability

- Medium to high, but the stack should remain modular so video backends can be swapped as stronger open models emerge

---

## 9. Speech Recognition

### Recommended solution

- Primary: Whisper Large-v3
- Backup: Distil-Whisper or a faster-whisper-based deployment

### Purpose

Used for English, Nigerian English accents, continuous speech, streaming recognition, and noise robustness.

### Strengths

- Strong multilingual recognition
- Good robustness for noisy audio
- Mature open-weight deployment path

### Weaknesses

- Not always optimized for very low-latency streaming without chunking and buffering
- Accent handling can still benefit from local fine-tuning

### Hardware requirements

- CPU-only is possible for small workloads
- GPU improves throughput and reduces latency

### GPU requirements

- CPU-only acceptable for low volume
- 1x GPU recommended for production-grade streaming

### RAM requirements

- 16GB minimum
- 32GB+ for batch or concurrent streams

### Expected inference speed

- Good for transcription and streaming when using optimized inference backends

### License

- Whisper-family models are widely used and generally acceptable for open-weight deployment with standard review

### Commercial-use compatibility

- Good, subject to license checks and packaging review

### Long-term suitability

- High because speech recognition is a foundational capability for African-language-first AI

---

## 10. Natural Text-to-Speech

### Recommended systems

- Primary: XTTS v2
- Backup: MeloTTS or Parler-TTS

### Purpose

Used for natural voices, low-latency speech synthesis, multilingual expansion, and future voice cloning where legally and ethically appropriate.

### Strengths

- Flexible voice output
- Strong multilingual potential
- Good for conversational agents and accessibility use cases

### Weaknesses

- Voice cloning must be carefully governed
- Naturalness varies by language and speaker quality

### Hardware requirements

- CPU-only can work for low-volume use
- GPU helpful for many concurrent streams

### GPU requirements

- CPU-only acceptable for development
- 1x GPU recommended for higher concurrency

### RAM requirements

- 16GB+ recommended

### Expected inference speed

- Fast enough for conversational use on modern hardware

### License

- Depends on the exact packaged model and voice assets used
- Voice-cloning features require clear consent, data governance, and rights management

### Commercial-use compatibility

- Good if voice data rights are handled properly

### Long-term suitability

- High because voice is a key differentiator for 9JA AI

---

## 11. Nigerian Language Intelligence Engine (NLIE)

The Nigerian Language Intelligence Engine is not a simple translation layer. It is a dedicated intelligence subsystem for all Nigerian-language capabilities.

### Core objective

Build an extensible language intelligence engine that can support every Nigerian language as resources become available, without redesigning the core architecture.

### Architectural model

NLIE will be built as a modular framework with the following layers:

1. Language registry
   - Each language is represented as a language profile
   - Profile contains script, orthography, dialect variants, tone rules, and locale rules

2. Shared linguistic core
   - Normalizer
   - Tokenizer
   - Text sanitizer
   - Grammar pattern engine
   - Transliteration support
   - Code-switch handling

3. Capability adapters
   - Translation
   - Language detection
   - Dialect detection
   - Accent handling
   - Slang and colloquial handling
   - Proverbs and idioms
   - Cultural-context retrieval
   - Grammar correction
   - Spell checking
   - Speech recognition
   - Text-to-speech
   - Language learning
   - Cross-language search

4. Data layer
   - Lexicon store
   - Grammar and morphology resources
   - Parallel corpora
   - Speech corpora
   - Cultural knowledge base
   - Evaluation datasets

5. Model layer
   - A multilingual base model for broad capability
   - Per-language adapters for localization
   - Fine-tuning pipelines for high-value languages

6. Runtime layer
   - Task routing by language and use case
   - Fallback to broader multilingual models when language-specific resources are sparse
   - Progressive specialization as quality improves

### Supported languages for Version 1

The engine should be built to support the following languages as first-wave priorities:

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

### Design requirements

- New languages must be added via data and profile plugins, not by rewriting the core engine
- The system must handle mixed-language input and code-switching
- The engine must support both low-resource and high-resource languages
- All outputs should preserve cultural context, not just lexical translation

### Long-term objective

The NLIE must become one of the defining competitive advantages of 9JA AI and should be designed to expand toward all Nigerian languages with sufficient data and community support.

---

## 12. Embedding Intelligence

### Recommended models

- Primary: BGE-M3
- Backup: Nomic Embed Text v1.5

### Purpose

Used for semantic search, retrieval-augmented generation, long-term memory, document search, image search, and similarity search.

### Strengths

- Strong retrieval quality
- Good multilingual handling
- Works well for retrieval and memory systems

### Weaknesses

- Quality depends on chunking strategy and indexing design
- Retrieval performance depends heavily on data quality

### Hardware requirements

- CPU is acceptable for small deployments
- GPU improves batch embedding throughput

### GPU requirements

- Optional, not mandatory for early stages

### RAM requirements

- 16GB+ for local indexing and experimentation

### Expected inference speed

- Fast enough for indexing and retrieval workloads

### License

- Generally permissive for open-weight deployment and commercial use, subject to package review

### Commercial-use compatibility

- Good

### Long-term suitability

- Very high because memory and retrieval are core to the platform

---

## 13. Vector Database

### Recommended solution

- Primary: Qdrant
- Backup: Milvus

### Purpose

Used for long-term AI memory, semantic search, document retrieval, image indexing, and similarity search.

### Strengths

- High-performance retrieval
- Easy self-hosting
- Good integration with RAG and memory workflows

### Weaknesses

- Operational complexity increases with large distributed deployments
- Multi-tenant indexing requires careful design

### Hardware requirements

- Local development: modest CPU and memory
- Production: larger storage and memory budget

### GPU requirements

- Not required for vector recall

### RAM requirements

- 8GB+ for small deployments
- 32GB+ for larger production deployments

### Expected inference speed

- Excellent for retrieval workloads

### License

- Qdrant and Milvus are open-source and suitable for self-hosted deployment

### Commercial-use compatibility

- High

### Long-term suitability

- Very high because memory and retrieval are strategic platform capabilities

---

## 14. Model Runtime Design

The future Model Runtime must be fully provider-agnostic and model-agnostic.

### Core responsibilities

- Model discovery
- Dynamic loading
- Versioning
- Health monitoring
- Benchmarking
- Rollback
- Resource allocation
- Multi-model execution
- GPU scheduling
- Distributed inference

### Recommended runtime architecture

1. Model registry
   - Keeps track of local and remote model artifacts
   - Stores metadata, version, compatibility, and benchmark results

2. Runtime adapter layer
   - Each model family is exposed through a runtime adapter
   - The Orchestrator does not talk to models directly

3. Inference server layer
   - vLLM for high-throughput serving
   - TensorRT-LLM for NVIDIA-optimized deployment
   - llama.cpp for CPU and edge-compatible inference
   - ONNX Runtime for smaller and optimized models

4. Scheduling and resource manager
   - Allocates GPU and CPU resources per workload
   - Supports queueing, failover, and load balancing

5. Health and benchmarking engine
   - Tracks latency, throughput, memory usage, and error rates
   - Supports automatic fallback when a model degrades

6. Versioning and rollback
   - Every deployed model instance must be versioned
   - Rollback must be an explicit runtime capability

### Runtime design principles

- The app never directly selects a model
- The Orchestrator always selects the runtime path
- Models can be swapped without rewriting the engine API
- Benchmarks and health metrics drive routing decisions

---

## 15. Hardware Strategy

### Development environment

- CPU: modern multi-core processor
- RAM: 32GB minimum
- Storage: 1TB NVMe SSD
- GPU: optional but strongly recommended

### CPU-only testing

- Suitable for small models and offline evaluation
- Good for smoke tests, unit tests, and non-latency-sensitive tasks

### Single-GPU deployment

- Recommended for early production
- Good for language, speech, OCR, and small image workloads

### Multi-GPU deployment

- Recommended for high-throughput inference and larger models
- Good for serving multiple capabilities concurrently

### Enterprise deployment

- Use dedicated inference nodes with GPU pools
- Separate training, evaluation, and serving clusters where possible

### Distributed inference

- Use multiple nodes for high-volume workloads
- Route traffic based on model type and hardware affinity

### Realistic estimates

- Small development node: 16–32GB RAM, 1 GPU optional
- Mid-range inference node: 64GB RAM, 1–2 GPUs
- Enterprise node: 128GB+ RAM, 2–8 GPUs depending on workload

---

## 16. Deployment Strategy

### Development

- Local Docker-based deployment
- Local model registry
- Local vector store
- Local observability

### Testing

- Staging environment with isolated GPU resources
- Benchmarking and regression testing per engine
- Integration tests against the orchestrator and runtime

### Production

- Containerized inference stack
- Kubernetes or equivalent orchestration for scalability
- Model registry and deployment automation
- Controlled rollout for new model versions

### Cloud infrastructure

- Use cloud GPU instances for burst traffic and production inference
- Keep data and memory stores hosted in controlled infrastructure

### On-premises deployment

- Preferred for enterprise privacy-sensitive workloads
- Deploy the same runtime stack with local storage and local GPU pools

### Hybrid deployment

- Keep small models and memory retrieval local
- Route large or expensive workloads to cloud GPUs when necessary

---

## 17. Licensing and Compliance Review

Every model or component recommended in this blueprint must be reviewed before production deployment.

### Recommended licensing posture

- Prefer permissive and clearly documented licenses where possible
- Avoid components with unclear or overly restrictive terms for commercial deployment
- Keep a legal review checklist for each adopted model and dependency

### Licensing notes

- Qwen-family stacks are strong candidates for commercial deployment with standard review
- Llama-family stacks are viable but require explicit review of redistribution and derivative-use obligations
- OCR and retrieval packages are generally easier to deploy commercially if packaged carefully
- Image and video models require stricter review because the ecosystem still contains multiple licensing variants
- Voice cloning features require additional consent and rights governance

### Compliance safeguards

- Maintain an approved-model registry
- Track model licenses in the deployment manifest
- Require legal review before shipping a new runtime stack
- Never assume a model is safe for commercial deployment just because it is open-weight

---

## 18. Scalability Roadmap

### Phase A — Foundation

- Finalize runtime abstraction
- Stand up local inference runtime
- Add model registry and health monitor
- Deploy a small language model and embedding stack

### Phase B — Core capabilities

- Launch language, OCR, and speech engines
- Add retrieval and memory services
- Stand up vector database

### Phase C — Visual intelligence

- Add vision and image capabilities
- Add editing workflows and inpainting/outpainting support

### Phase D — Advanced media

- Introduce video generation and advanced speech features
- Add multilingual lifecycle support for Nigerian languages

### Phase E — NLIE expansion

- Expand language profiles and data resources
- Add dialect and accent handling
- Improve grammar correction and speech support

### Phase F — Enterprise scale

- Multi-node deployment
- Distributed inference scheduling
- Advanced observability and failover

---

## 19. Risk Assessment

### Key risks

- Licensing ambiguity for some model families
- Data scarcity for many Nigerian languages
- Limited high-quality speech and text corpora for some languages
- High GPU cost for large models
- Latency and throughput trade-offs for video and high-quality image generation
- Need for continuous benchmark and evaluation pipelines

### Mitigation strategy

- Keep the runtime modular so models can be swapped
- Use benchmarks and canary rollouts for every major model upgrade
- Prioritize data collection and evaluation for Nigerian languages
- Use smaller models for latency-sensitive features and larger models for more complex reasoning tasks

---

## 20. Integration Strategy with Existing 9JA AI Core

The existing 9JA AI Core remains the architectural center.

### Integration rules

- The Android app must communicate only with the Core
- The Core must route requests through the Orchestrator
- Capability engines must expose stable contracts to the Orchestrator
- The runtime must remain behind the engine abstraction layer
- Model selection must be invisible to the application layer

### Target integration pattern

- App → Core API → Orchestrator → Engine → Runtime → Model
- The app never directly selects a model or vendor

---

## 21. Phased Implementation Plan for Each Engine

### Phase 1 — Runtime and foundation

- Implement the runtime abstraction layer
- Stand up model registry and health checks
- Add benchmark and rollback support

### Phase 2 — Language engine

- Deploy the primary language model
- Add structured prompting, memory support, and task routing
- Introduce reasoning and coding capabilities

### Phase 3 — Vision and OCR engine

- Add multimodal understanding and visual reasoning
- Add OCR for documents and structured forms

### Phase 4 — Image engine

- Add text-to-image, image editing, and inpainting/outpainting
- Add prompt safety and output quality controls

### Phase 5 — Speech engine

- Add transcription and TTS
- Introduce streaming and interruption handling

### Phase 6 — Memory and retrieval

- Add embedding pipeline
- Stand up vector database and retrieval services
- Connect memory to the Orchestrator

### Phase 7 — Video engine

- Add video generation and editing workflows
- Keep video behind a separate throughput-limited serving path

### Phase 8 — NLIE expansion

- Add Nigerian-language profiles and dialect handling
- Expand language datasets and evaluation pipelines

### Phase 9 — Production hardening

- Add multi-node deployment, monitoring, and rollback support
- Run cross-model benchmarking and policy review

---

## 22. Final Recommendation

The official Version 1 stack should be centered on an open-weight-first architecture with a modular runtime, provider-agnostic orchestration, and an explicit Nigerian-language strategy.

### Recommended official baseline

- Language: Qwen2.5 72B Instruct
- Vision: Qwen2-VL 72B
- OCR: PaddleOCR + PP-StructureV2
- Image: SDXL-based editing pipeline
- Video: CogVideoX-5B
- Speech recognition: Whisper Large-v3
- TTS: XTTS v2
- Embeddings: BGE-M3
- Vector DB: Qdrant
- Runtime: vLLM + TensorRT-LLM + llama.cpp
- NLIE: modular language-profile framework with plugin-based language expansion

This baseline is the strongest architecture for 9JA AI because it balances model capability, maintainability, hardware practicality, and long-term independence from commercial inference providers.

---

## 23. Approval Gate

No implementation should begin until this blueprint is reviewed and approved.

The next step after approval is to turn this document into a phased execution plan for the engines and runtime, one capability at a time.
