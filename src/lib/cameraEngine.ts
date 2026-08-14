export interface CameraCaptureOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export function getCameraPermissionMessage(): string {
  return "Camera access isn't available. You can upload an image instead.";
}

export async function requestCameraAccess(options: CameraCaptureOptions = {}): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error(getCameraPermissionMessage());
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: options.facingMode ?? 'environment',
      width: { ideal: options.width ?? 1280 },
      height: { ideal: options.height ?? 720 },
    },
    audio: false,
  });
  return stream;
}

export async function captureFrameFromVideo(video: HTMLVideoElement): Promise<string> {
  if (!video) throw new Error('No video element supplied');

  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1024 / Math.max(video.videoWidth || 1, video.videoHeight || 1));
  canvas.width = Math.max(1, Math.round((video.videoWidth || 1) * scale));
  canvas.height = Math.max(1, Math.round((video.videoHeight || 1) * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not access the camera canvas.');

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export async function openCameraPreview(video: HTMLVideoElement, options: CameraCaptureOptions = {}): Promise<void> {
  const stream = await requestCameraAccess(options);
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play().catch(() => undefined);
}

export function stopCameraStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
