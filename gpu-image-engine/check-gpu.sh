#!/usr/bin/env bash
# check-gpu.sh
# Run on the GPU host to validate GPU visibility, NVIDIA drivers, and container GPU passthrough.

set -euo pipefail

echo "Checking nvidia-smi availability..."
if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia-smi || true
else
  echo "nvidia-smi not found on PATH. Driver may not be installed."
fi

echo "Checking Docker GPU passthrough with a CUDA container..."
if command -v docker >/dev/null 2>&1; then
  docker run --rm --gpus all nvidia/cuda:12.1.1-runtime-ubuntu22.04 nvidia-smi
else
  echo "docker not found. Install docker and retry."
fi

echo "If the above nvidia-smi output shows GPUs and CUDA driver versions, the host GPU is visible to containers."
exit 0
