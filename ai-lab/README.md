# 9JA AI — AI Lab

The `ai-lab/` directory is the research and experimentation workspace for the 9JA AI platform. It contains training pipelines, evaluation harnesses, benchmarks, and raw datasets — especially focused on African languages.

## Structure

```
ai-lab/
├── datasets/       # Raw and processed language datasets
├── training/       # Fine-tuning scripts and configs
├── evaluation/     # Evaluation harnesses and metrics
├── benchmarks/     # Benchmark suites and result logs
├── experiments/    # One-off experiment notebooks and scripts
├── research/       # Research notes, papers, and findings
└── models/         # Trained model artefacts and checkpoints
```

## Priority Research Areas

### 1. Edo Language Corpus
- Collect and clean Edo (Bini) text from traditional literature, transcribed oral histories, and community contributions.
- Target: 100k+ tokens for initial fine-tuning.

### 2. Nigerian Pidgin NLP
- Build a tokeniser and language model fine-tuning dataset for Nigerian Pidgin (PCM).

### 3. African Language Translation Pairs
- Edo ↔ English, Yoruba ↔ English, Igbo ↔ English translation pairs.
- Evaluate against BLEU, chrF, and COMET metrics.

### 4. Speech Benchmarks
- Record and annotate Edo TTS reference audio for MOS (Mean Opinion Score) evaluation.
- Compare ElevenLabs, Google TTS, and local model outputs.

## Getting Started

1. See `datasets/` for data preparation scripts.
2. See `training/` for fine-tuning guides.
3. See `evaluation/` for running benchmarks against baseline models.
4. Use `experiments/` as a sandbox — keep notebooks clean and documented.

## Guidelines

- All datasets must be licensed for AI training use — document provenance.
- Never commit raw API keys or secrets inside this directory.
- Tag model checkpoints with date and experiment ID.
