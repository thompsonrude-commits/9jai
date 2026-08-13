FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/data/.cache/huggingface \
    OUTPUT_DIR=/data/outputs

WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg git ca-certificates && \
    rm -rf /var/lib/apt/lists/*
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r requirements.txt

COPY app.py .
RUN mkdir -p /data/outputs /data/.cache/huggingface

EXPOSE 7860
CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
