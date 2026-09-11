#!/usr/bin/env bash
# check-models.sh
# Verify required model checkpoint files exist in the mounted /models directory.

set -euo pipefail

MODELS_DIR=${1:-/models}
REQUIRED=(
  "sd_xl_turbo_1.0_fp16.safetensors"
  "flux1-schnell.safetensors"
  "flux1-dev.safetensors"
)

missing=()
for f in "${REQUIRED[@]}"; do
  if [ ! -f "$MODELS_DIR/$f" ]; then
    missing+=("$f")
  fi
done

if [ ${#missing[@]} -eq 0 ]; then
  echo "MODEL READY: all required checkpoints are present in $MODELS_DIR"
  exit 0
else
  echo "MODEL MISSING: the following files are missing from $MODELS_DIR:" >&2
  for m in "${missing[@]}"; do echo "  - $m" >&2; done
  echo "Place the required checkpoint files into $MODELS_DIR or create symlinks from your model storage. Do NOT commit model files to source control." >&2
  exit 2
fi
