---
title: 9JA AI Video Worker
emoji: 🇳🇬
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
---

# 9JA AI Video Worker

GPU worker for the existing 9JA AI VideoEngine. It is designed for a Hugging Face
Docker Space and does not expose provider-specific details to the frontend.

## API

### `GET /health`

Returns worker readiness, model names, GPU availability, queue length, and supported
operations.

### `POST /generate`

Request:

```json
{
  "prompt": "A cinematic Lagos skyline at sunset",
  "image": "data:image/png;base64,...",
  "duration": 5,
  "width": 768,
  "height": 432,
  "model": "wan2.1"
}
```

`image` is optional. Without it the worker performs text-to-video; with it the worker
performs image-to-video.

Response:

```json
{"jobId":"job_...","status":"queued","model":"Wan-AI/Wan2.1-T2V-1.3B"}
```

### `GET /status/{job_id}`

Returns `queued`, `processing`, `completed`, or `failed`. Completed jobs include a
relative `videoUrl` and `mimeType: video/mp4`.

## Deploying to Hugging Face Spaces

1. Create a new **Docker Space** owned by the 9JA AI account.
2. Select a GPU hardware tier appropriate for the selected model.
3. Upload the contents of this directory to the Space.
4. Wait for the Space to build and become `Running`.
5. Test `/health`.
6. Set the Firebase server-side `VIDEO_WORKER_URL` to the actual Space URL.

The application must not be configured with a URL until the Space is actually
created and its health endpoint reports `ready`.

## Model configuration

- `WAN_T2V_MODEL` defaults to `Wan-AI/Wan2.1-T2V-1.3B`.
- `WAN_I2V_MODEL` defaults to `Wan-AI/Wan2.1-I2V-14B-480P`.
- `VIDEO_MAX_DURATION` defaults to `10`.
- `VIDEO_MAX_WIDTH` defaults to `1280`.
- `VIDEO_MAX_HEIGHT` defaults to `720`.
- `VIDEO_MAX_CONCURRENCY` defaults to `1`.

The I2V model is substantially larger than the T2V model and requires a suitably
large GPU. The worker reports an explicit failure instead of returning a fake video
if the model cannot load or inference fails.
