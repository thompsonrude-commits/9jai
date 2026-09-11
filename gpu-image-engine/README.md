9JAI gpu-image-engine — Operator deployment guide

Purpose
-------
This folder contains an operator-focused container and compose configuration to run a self-hosted ComfyUI + GPU stack for 9JAI's native image generation.

Files
-----
- Dockerfile — builds a ComfyUI runtime container. Clones ComfyUI repo and sets up a venv.
- docker-compose.yml — example compose file with GPU device_requests, model/workflow/output mounts, and healthcheck.
- start-comfy.sh — lightweight startup wrapper used by the image.

Design principles
-----------------
- Model files must be mounted from external persistent storage (host path, NFS, or cloud volume). Do NOT commit model checkpoints into source control.
- COMFYUI_API_KEY (optional) can be set as an environment variable; the 9JAI backend will use it to authenticate to the ComfyUI /prompt endpoint if provided.
- The ComfyUI HTTP contract expected by 9JAI: POST /prompt => { prompt_id }, GET /history/{prompt_id} => generation history, GET /system_stats => health data, GET /view?filename=... => raw image object retrieval.

Quick start (bare-metal / VM with NVIDIA drivers)
-------------------------------------------------
1. Provision a VM with a supported NVIDIA GPU and install drivers + NVIDIA Container Toolkit.
   - Ubuntu 22.04 is recommended for compatibility.
   - Follow NVIDIA's official guide: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

2. Clone 9JAI repo (operator machine) and cd into this folder:
   git clone <repo>
   cd <repo>/gpu-image-engine

3. Place your legally-licensed model checkpoints in ./models (or mount a persistent volume):
   mkdir -p models
   # upload or mount your model checkpoints into models/checkpoints or as required by your ComfyUI instance

4. Build and run with docker-compose:
   docker compose up -d --build

   If docker-compose runtime/device requests are unsupported, run with docker:
   docker run --gpus all -p 7860:7860 -v $(pwd)/models:/models -v $(pwd)/workflows:/workflows -v $(pwd)/outputs:/outputs 9jai/comfyui:latest

5. Verify health locally:
   curl http://localhost:7860/system_stats
   # Expected: JSON with GPU/VRAM information (depends on ComfyUI build)

6. Configure 9JAI backend: set COMFYUI_ENDPOINT to your ComfyUI base URL (e.g., http://<VM_IP>:7860). If using an API key, set COMFYUI_API_KEY as a secret (do not expose this in client-side code).

Cloud deployment notes (GCP)
----------------------------
Option A — GCE VM (recommended for persistent, stateful ComfyUI):
- Create a Compute Engine VM with a GPU (e.g., a2-highgpu-1g or n1-standard with attached GPU), install NVIDIA drivers and Docker, enable NVIDIA Container Toolkit, then deploy with docker-compose as above.
- Use a persistent disk or Filestore/NFS for the /models mount so models persist across reboots.
- Use firewall rules to restrict access to the ComfyUI port; prefer running behind an internal load balancer or an authenticated gateway.

Option B — Cloud Run (container) — Cloud Run for Anthos / Cloud Run on GKE or managed Cloud Run with GPU support (where available):
- Cloud Run (managed) historically did not support GPUs; use Cloud Run (GKE) or GKE Autopilot with GPU nodes, or use GCE VM for stable GPU workloads.
- If using GKE, deploy the container to a GPU node pool and use a Kubernetes Service with an internal LoadBalancer.

Security
--------
- Keep COMFYUI endpoint private inside your VPC or restrict with an API gateway.
- Use Cloud Secret Manager / environment secrets to store COMFYUI_API_KEY and do NOT expose the key to frontend bundles.
- Use firewall rules or private network peering so only the 9JAI backend can reach the ComfyUI endpoint.

Model registry
--------------
The 9JAI backend expects models referenced in the repository's NATIVE_MODELS registry to be present on the ComfyUI host. Confirm that the checkpoint filenames in NATIVE_MODELS match the files placed under the mounted /models path. If they do not match, update either the model files or the NATIVE_MODELS registry to align.

Required model checkpoint filenames (as referenced by the current NATIVE_MODELS registry):
- sd_xl_turbo_1.0_fp16.safetensors (sdxl-turbo)
- flux1-schnell.safetensors (flux-schnell)
- flux1-dev.safetensors (flux-dev)

Minimum VRAM recommendations (per model):
- sdxl-turbo: ~8 GB VRAM (recommended 12 GB)
- flux1-schnell: ~12 GB VRAM
- flux1-dev: ~16 GB VRAM

Place these files under the mounted /models path (do NOT commit them to source control) or create symlinks that point into your model storage location.

Health & readiness
------------------
The 9JAI backend will query /system_stats to check ComfyUI readiness and vram metrics. Ensure your ComfyUI build exposes this endpoint; adapt the backend if you use a different path.

Important operator notes
------------------------
- Do not commit or store model checkpoint files in this repository.
- Verify legality and licensing for any models you deploy.
- For production, run ComfyUI behind an authenticated gateway and use Google IAM service accounts and Cloud Tasks to trigger workers rather than exposing admin keys or public endpoints.

Troubleshooting
---------------
- "system_stats returns 404": Confirm the ComfyUI build supports /system_stats (community builds vary). If not, provide a lightweight endpoint that reports GPU readiness for 9JAI to poll.
- "GPU not visible to container": Ensure NVIDIA drivers are installed on the host and the NVIDIA Container Toolkit is installed. Test with `docker run --rm --gpus all nvidia/cuda:12.1.1-runtime-ubuntu22.04 nvidia-smi`.

Contact
-------
If assistance is needed during operator deployment, provide the following when requesting help:
- GCE instance type + driver versions
- Docker / NVIDIA Container Toolkit logs
- ComfyUI /system_stats output (if any)

Deployment automation
---------------------
This repository includes helper scripts to automate and validate a GCE VM-based deployment. They do NOT run or create cloud resources from this repository — they are operator-run scripts and require an authenticated gcloud session and appropriate IAM permissions.

Files added:
- deploy-gce.sh   # Operator script to create a GCE VM, enable APIs, and provide manual post-creation steps
- check-gpu.sh    # Run on the GPU host to verify nvidia-smi and container GPU passthrough
- check-models.sh # Verify required checkpoint filenames exist under /models

Quick usage notes
-----------------
1. Provision and authenticate gcloud locally:
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID

2. Create a VM (operator-run):
   GCP_PROJECT_ID=your-project GCP_ZONE=us-central1-a VM_NAME=9jai-comfy ./deploy-gce.sh
   The script will create an instance and display manual post-creation steps to install drivers, Docker, and NVIDIA Container Toolkit. It purposefully requires operator confirmation before creating resources.

3. On VM: install drivers, install Docker, install NVIDIA Container Toolkit, verify GPU with:
   sudo docker run --rm --gpus all nvidia/cuda:12.1.1-runtime-ubuntu22.04 nvidia-smi

4. Place model checkpoints in /models on the VM (or mount a persistent disk):
   - sd_xl_turbo_1.0_fp16.safetensors
   - flux1-schnell.safetensors
   - flux1-dev.safetensors
   Then run: ./check-models.sh /models

5. Start ComfyUI on the VM using the provided docker-compose.yml (in the gpu-image-engine folder):
   docker compose up -d --build
   Verify: curl http://localhost:7860/system_stats

6. Configure the 9JAI backend (Functions): set COMFYUI_ENDPOINT to the VM's internal or external URL and, if used, COMFYUI_API_KEY (store in Secret Manager). Ensure Functions can reach the VM.

Cost control
------------
To avoid unexpected costs, follow these operator actions:
- Stop the VM when idle:
  gcloud compute instances stop VM_NAME --zone ZONE
- Start the VM when needed:
  gcloud compute instances start VM_NAME --zone ZONE
- Delete the VM and preserve the persistent disk (if desired):
  gcloud compute instances delete VM_NAME --zone ZONE --keep-disks=all

Notes
-----
- The scripts are operator-facing and require manual verification steps. They are designed to be safe and conservative; they will ask for a confirmation before creating resources.
- Do NOT place model checkpoint files into git. Use persistent disks or cloud storage and rsync onto the VM as needed.
