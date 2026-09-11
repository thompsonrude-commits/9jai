# gpu-image-engine/Dockerfile
# Base image: Use an official CUDA runtime image. Choose an image that matches your host drivers.
# Operators: pick the CUDA tag that matches your GPU driver stack (e.g., 12.1/11.8).
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    python3 \
    python3-distutils \
    python3-venv \
    python3-pip \
    build-essential \
    ffmpeg \
    libgl1 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Create a lightweight non-root user
RUN useradd -m -s /bin/bash comfy
WORKDIR /home/comfy

# Install ComfyUI in /home/comfy/ComfyUI
# NOTE: This Dockerfile clones the upstream ComfyUI repository. Pin to a tag/commit in production.
RUN git clone https://github.com/comfyanonymous/ComfyUI.git ComfyUI || true
WORKDIR /home/comfy/ComfyUI

# Create a venv and install Python deps (use system pip to bootstrap)
RUN python3 -m venv /home/comfy/venv
ENV PATH="/home/comfy/venv/bin:$PATH"
RUN pip install --upgrade pip setuptools wheel
# Install requirements if available; tolerate absence for flexible ops
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Expose ComfyUI default port
ENV PORT=7860
EXPOSE ${PORT}

# Volumes for models and workflows - operators must mount these from host or network storage
VOLUME ["/models", "/workflows", "/outputs"]

# Provide environment defaults (can be overridden by docker-compose or cloud runtime)
ENV MODEL_DIRECTORY=/models
ENV OUTPUT_DIRECTORY=/outputs
ENV COMFYUI_API_KEY=

# Healthcheck (uses system_stats). If /system_stats is not provided by a custom deployment of ComfyUI,
# operators should adapt to the actual readiness endpoint of their ComfyUI build.
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -fsS --max-time 2 http://127.0.0.1:${PORT}/system_stats || exit 1

# Copy a simple start script
COPY start-comfy.sh /home/comfy/start-comfy.sh
RUN chmod +x /home/comfy/start-comfy.sh

# Use non-root user for runtime
USER comfy
WORKDIR /home/comfy/ComfyUI

ENTRYPOINT ["/home/comfy/start-comfy.sh"]
CMD ["--listen", "--port", "7860"]
