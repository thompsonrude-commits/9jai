import base64
import io
import os
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import imageio.v2 as imageio
import torch
from diffusers import WanImageToVideoPipeline, WanPipeline
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from PIL import Image

app = FastAPI(title="9JA AI Video Worker", version="1.0.0")
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "/data/outputs"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
T2V_MODEL = os.getenv("WAN_T2V_MODEL", "Wan-AI/Wan2.1-T2V-1.3B")
I2V_MODEL = os.getenv("WAN_I2V_MODEL", "Wan-AI/Wan2.1-I2V-14B-480P")
MAX_DURATION = int(os.getenv("VIDEO_MAX_DURATION", "10"))
MAX_WIDTH = int(os.getenv("VIDEO_MAX_WIDTH", "1280"))
MAX_HEIGHT = int(os.getenv("VIDEO_MAX_HEIGHT", "720"))
MAX_CONCURRENCY = max(1, int(os.getenv("VIDEO_MAX_CONCURRENCY", "1")))
JOBS: dict[str, dict[str, Any]] = {}
JOBS_LOCK = threading.Lock()
EXECUTOR = ThreadPoolExecutor(max_workers=MAX_CONCURRENCY)
PIPELINES: dict[str, Any] = {}
PIPELINE_LOCK = threading.Lock()


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    image: str | None = None
    duration: float = Field(default=5, ge=1, le=MAX_DURATION)
    width: int = Field(default=768, ge=256, le=MAX_WIDTH)
    height: int = Field(default=432, ge=256, le=MAX_HEIGHT)
    model: str | None = None


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def update_job(job_id: str, **patch: Any) -> None:
    with JOBS_LOCK:
        JOBS[job_id].update(patch, updatedAt=now())


def decode_image(value: str) -> Image.Image:
    encoded = value.split(",", 1)[1] if "," in value else value
    return Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")


def get_pipeline(image_to_video: bool, model: str | None) -> Any:
    key = "i2v" if image_to_video else "t2v"
    with PIPELINE_LOCK:
        if key in PIPELINES:
            return PIPELINES[key]
        model_id = model or (I2V_MODEL if image_to_video else T2V_MODEL)
        if not torch.cuda.is_available():
            raise RuntimeError("No CUDA GPU is available for video inference.")
        dtype = torch.float16
        if image_to_video:
            pipeline = WanImageToVideoPipeline.from_pretrained(
                model_id, torch_dtype=dtype
            )
        else:
            pipeline = WanPipeline.from_pretrained(model_id, torch_dtype=dtype)
        pipeline.enable_model_cpu_offload()
        PIPELINES[key] = pipeline
        return pipeline


def render(job_id: str, request: GenerateRequest) -> None:
    update_job(job_id, status="processing")
    try:
        image_to_video = request.image is not None
        pipeline = get_pipeline(image_to_video, request.model)
        frames = max(8, min(49, round(request.duration * 8)))
        kwargs: dict[str, Any] = {
            "prompt": request.prompt,
            "height": request.height,
            "width": request.width,
            "num_frames": frames,
            "guidance_scale": 5.0,
            "num_inference_steps": 30,
        }
        if image_to_video:
            kwargs["image"] = decode_image(request.image or "")
        result = pipeline(**kwargs)
        video_frames = result.frames[0]
        filename = f"{job_id}.mp4"
        path = OUTPUT_DIR / filename
        imageio.mimsave(path, video_frames, fps=8, codec="libx264")
        if not path.exists() or path.stat().st_size == 0:
            raise RuntimeError("Video encoder produced an empty file.")
        update_job(
            job_id,
            status="completed",
            videoUrl=f"/outputs/{filename}",
            mimeType="video/mp4",
            model=request.model or (I2V_MODEL if image_to_video else T2V_MODEL),
        )
    except Exception as exc:
        update_job(job_id, status="failed", error=str(exc))


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ready" if torch.cuda.is_available() else "offline",
        "model": T2V_MODEL,
        "i2vModel": I2V_MODEL,
        "gpu": torch.cuda.is_available(),
        "gpuName": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "queueLength": sum(job["status"] in {"queued", "processing"} for job in JOBS.values()),
        "textToVideo": torch.cuda.is_available(),
        "imageToVideo": torch.cuda.is_available(),
        "workerVersion": "1.0.0",
    }


@app.post("/generate", status_code=202)
def generate(request: GenerateRequest) -> dict[str, Any]:
    if not torch.cuda.is_available():
        raise HTTPException(status_code=503, detail="Video worker is offline: CUDA GPU unavailable.")
    job_id = f"job_{uuid.uuid4().hex}"
    JOBS[job_id] = {
        "jobId": job_id,
        "status": "queued",
        "model": request.model or (I2V_MODEL if request.image else T2V_MODEL),
        "createdAt": now(),
        "updatedAt": now(),
    }
    EXECUTOR.submit(render, job_id, request)
    return JOBS[job_id]


@app.get("/status/{job_id}")
def status(job_id: str) -> dict[str, Any]:
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Video job not found")
    return job


@app.get("/outputs/{filename}")
def output(filename: str) -> FileResponse:
    path = (OUTPUT_DIR / filename).resolve()
    if path.parent != OUTPUT_DIR.resolve() or not path.is_file() or path.stat().st_size == 0:
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(path, media_type="video/mp4", filename=path.name)
