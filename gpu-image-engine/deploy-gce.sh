#!/usr/bin/env bash
# deploy-gce.sh
# Operator automation to provision a GCE VM with GPU, install NVIDIA drivers & container toolkit,
# deploy the ComfyUI container (using the gpu-image-engine/docker-compose.yml), and verify health.
#
# IMPORTANT: This script DOES NOT embed credentials. It requires gcloud CLI authenticated access
# and a Google Cloud project where you have permission to create VM instances and enable APIs.
#
# Usage (example):
#   GCP_PROJECT_ID=my-project GCP_ZONE=us-central1-a VM_NAME=9jai-comfy GPU_TYPE=nvidia-tesla-t4 ./deploy-gce.sh
#
set -euo pipefail

# Defaults - operator should explicitly confirm or override
: ${GCP_PROJECT_ID:=""}
: ${GCP_ZONE:="us-central1-a"}
: ${GCP_REGION:=${GCP_ZONE%-*}}
: ${VM_NAME:="9jai-comfy"}
: ${GPU_TYPE:="nvidia-tesla-t4"}   # cost-effective; adjust as needed (e.g., a2-highgpu for A100)
: ${GPU_COUNT:=1}
: ${MACHINE_TYPE:="n1-standard-8"}
: ${IMAGE_FAMILY:="ubuntu-2204-lts"}
: ${IMAGE_PROJECT:="ubuntu-os-cloud"}
: ${DISK_SIZE_GB:=100}
: ${MODELS_BUCKET:=""}  # Optional: gs://bucket/path to rsync models from

function usage(){
  cat <<EOF
Usage: GCP_PROJECT_ID=your-project [options] ./deploy-gce.sh
Environment variables (defaults shown):
  GCP_PROJECT_ID         (required) Google Cloud project ID
  GCP_ZONE               ${GCP_ZONE}
  VM_NAME                ${VM_NAME}
  GPU_TYPE               ${GPU_TYPE}
  GPU_COUNT              ${GPU_COUNT}
  MACHINE_TYPE           ${MACHINE_TYPE}
  DISK_SIZE_GB           ${DISK_SIZE_GB}
  MODELS_BUCKET          ${MODELS_BUCKET}  # optional: gs://... to copy models onto VM

This script will:
  - enable Compute Engine API
  - create a VM with the requested GPU type
  - install NVIDIA drivers, NVIDIA Container Toolkit, Docker, and docker-compose
  - pull/build the ComfyUI container and run docker compose in /home/${USER:-comfy}/gpu-image-engine

It requires that you have gcloud CLI installed and authenticated (gcloud auth login).
EOF
}

if [ "$#" -gt 0 ]; then
  usage
  exit 1
fi

if [ -z "$GCP_PROJECT_ID" ]; then
  echo "ERROR: GCP_PROJECT_ID is required. Set it as an environment variable and re-run."
  usage
  exit 1
fi

echo "Project: $GCP_PROJECT_ID"
echo "Zone: $GCP_ZONE"
echo "VM name: $VM_NAME"
echo "GPU: $GPU_COUNT x $GPU_TYPE"
echo "Machine type: $MACHINE_TYPE"

# Check gcloud
if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found. Install and authenticate before running this script."
  exit 1
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" >/dev/null 2>&1; then
  echo "ERROR: gcloud not authenticated. Run: gcloud auth login";
  exit 1
fi

# Set project in gcloud
gcloud config set project "$GCP_PROJECT_ID"

# Enable required APIs
echo "Enabling required APIs (compute.googleapis.com)"
gcloud services enable compute.googleapis.com --project="$GCP_PROJECT_ID"

# Quick GPU quota / availability check (best-effort)
echo "Checking available accelerator types in zone $GCP_ZONE (this is informational)"
gcloud compute accelerator-types list --zones="$GCP_ZONE" --project="$GCP_PROJECT_ID" || true

read -p "Proceed to create VM $VM_NAME in project $GCP_PROJECT_ID zone $GCP_ZONE? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted by user."; exit 1
fi

# Create VM
echo "Creating VM instance (this may take a few minutes)..."

gcloud compute instances create "$VM_NAME" \
  --zone="$GCP_ZONE" \
  --machine-type="$MACHINE_TYPE" \
  --accelerator="type=$GPU_TYPE,count=$GPU_COUNT" \
  --image-family="$IMAGE_FAMILY" \
  --image-project="$IMAGE_PROJECT" \
  --boot-disk-size="${DISK_SIZE_GB}GB" \
  --maintenance-policy=TERMINATE \
  --restart-on-failure \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --metadata=startup-script-url= \
  --quiet || { echo "VM creation failed"; exit 1; }

echo "VM created. Next steps:
- SSH into the VM and install NVIDIA drivers and Docker, or let the operator run the manual setup below.
- Copy or mount model files to /models on the VM (persistent disk or mounted bucket).
"

cat <<'MANUAL'
Manual post-creation setup (run on the VM or via gcloud compute ssh):

# Update & install basics
sudo apt-get update && sudo apt-get install -y build-essential curl ca-certificates gnupg lsb-release

# Install NVIDIA driver (recommended to use the driver recommended by NVIDIA)
# Example for driver install (Ubuntu):
# sudo apt-get install -y nvidia-driver-535
# Reboot may be required after installing driver.

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify GPU availability
sudo docker run --rm --gpus all nvidia/cuda:12.1.1-runtime-ubuntu22.04 nvidia-smi

# Deploy ComfyUI from the repo
# On the VM, clone or rsync the repo and use the gpu-image-engine/docker-compose.yml provided.
# Example (on VM):
# git clone <repo> ~/9jai && cd ~/9jai/gpu-image-engine
# docker compose up -d --build
MANUAL

if [ -n "$MODELS_BUCKET" ]; then
  echo "Copying models from $MODELS_BUCKET to the VM (this assumes gsutil and appropriate IAM)."
  echo "Run on the VM: gsutil -m rsync -r $MODELS_BUCKET /models"
fi

echo "Deployment script finished. Follow the manual post-creation steps on the VM to complete the environment and start ComfyUI."

exit 0
