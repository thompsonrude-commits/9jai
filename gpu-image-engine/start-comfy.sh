#!/bin/bash
# Simple startup wrapper for ComfyUI
# Mountpoints expected: /models (checkpoints), /workflows (custom workflows), /outputs (generated files)

set -euo pipefail

# Activate venv if present
if [ -d /home/comfy/venv ]; then
  source /home/comfy/venv/bin/activate
fi

# If an API key is set in env, print safe notice (do not print the key itself)
if [ ! -z "${COMFYUI_API_KEY:-}" ]; then
  echo "ComfyUI API key provided (not displayed)."
fi

# Ensure model directory exists
mkdir -p "${MODEL_DIRECTORY:-/models}"
mkdir -p "${OUTPUT_DIRECTORY:-/outputs}"

# Start ComfyUI - adjust the command to match your ComfyUI entrypoint if it's different
# Many community builds use: python main.py or python launch.py — check your ComfyUI docs
if command -v python3 &> /dev/null; then
  # Run ComfyUI with listening flag (this example uses the community entrypoint `main.py`)
  python3 main.py "$@"
else
  echo "python3 not found; cannot start ComfyUI"
  exit 1
fi
