import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { generateImageNative, checkNativeAIAvailable, getNativeAIStatus, NativeGenerationRequest, NativeGenerationResult } from './nativeAIEngine';
import * as jobQueue from './jobQueue';

export type ComfyHealth = {
  configured: boolean;
  reachable: boolean;
  gpuAvailable: boolean;
  modelAvailable: boolean;
  generationAvailable: boolean;
  details?: Record<string, any>;
};

// Simple adapter that centralizes ComfyUI interactions. It delegates to nativeAIEngine.

export async function healthCheck(): Promise<ComfyHealth> {
  const configured = !!(process.env.COMFYUI_ENDPOINT);
  try {
    const status = await getNativeAIStatus();
    const reachable = !!status.available;
    const models = status.models || [];
    const modelAvailable = models.length > 0;
    const gpuAvailable = Boolean(status.vramTotal && status.vramTotal > 0);
    const generationAvailable = reachable && gpuAvailable && modelAvailable;

    return {
      configured,
      reachable,
      gpuAvailable,
      modelAvailable,
      generationAvailable,
      details: {
        vramUsed: status.vramUsed,
        vramTotal: status.vramTotal,
        models,
      },
    };
  } catch (err: any) {
    return {
      configured,
      reachable: false,
      gpuAvailable: false,
      modelAvailable: false,
      generationAvailable: false,
      details: { error: err?.message || String(err) },
    };
  }
}

export async function getSystemStats(): Promise<any> {
  return getNativeAIStatus();
}

// For Phase 2: provide generateImage which runs a native generation synchronously in background and returns a generationId.
// It stores status in Firestore under collection `image_generations` and uploads outputs to Firebase Storage.

const GEN_COLLECTION = 'image_generations';

export interface GenerationRecord {
  id: string;
  userId?: string;
  prompt: string;
  createdAt: number;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  provider: 'comfyui' | 'none';
  imageUrl?: string;
  error?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

async function saveGenerationRecord(rec: GenerationRecord) {
  try {
    const db = admin.firestore();
    await db.collection(GEN_COLLECTION).doc(rec.id).set(rec, { merge: true });
  } catch (err: any) {
    // best-effort only
    console.warn('[comfyAdapter] Failed to persist generation record to Firestore:', err?.message || err);
  }
}

export async function generateImage(request: NativeGenerationRequest, userId?: string): Promise<{ generationId: string }> {
  const id = `gen-${uuidv4()}`;
  const record: GenerationRecord = {
    id,
    userId: userId,
    prompt: request.prompt,
    createdAt: Date.now(),
    status: 'queued',
    provider: 'comfyui',
    width: request.width,
    height: request.height,
    steps: request.steps,
    cfg_scale: request.cfg_scale,
    seed: request.seed,
  };

  // Persist queued state
  await saveGenerationRecord(record);

  // Enqueue job for processing by GPU workers. A separate worker/process should call processNextJob()
  try {
    await jobQueue.enqueueJob({ id, request, createdAt: Date.now(), status: 'queued', userId });
  } catch (err: any) {
    console.warn('[comfyAdapter] Failed to enqueue job:', err?.message || err);
  }

  return { generationId: id };
}

/**
 * Process the next queued job (admin/worker-triggered). Returns true if a job was processed.
 */
export async function processNextJob(): Promise<boolean> {
  const claimed = await jobQueue.claimNextJob();
  if (!claimed) {
    return false;
  }

  const id = claimed.id;
  const record: GenerationRecord = {
    id,
    userId: claimed.userId,
    prompt: claimed.request.prompt || 'queued-job',
    createdAt: claimed.createdAt || Date.now(),
    status: 'generating',
    provider: 'comfyui',
    width: claimed.request.width,
    height: claimed.request.height,
    steps: claimed.request.steps,
    cfg_scale: claimed.request.cfg_scale,
    seed: claimed.request.seed,
  };

  // Persist generating state
  await saveGenerationRecord(record);

  try {
    const available = await checkNativeAIAvailable();
    if (!available) {
      record.status = 'failed';
      record.error = 'ComfyUI not reachable';
      await saveGenerationRecord(record);
      await jobQueue.markJobFailed(id, record.error);
      return true;
    }

    const result: NativeGenerationResult = await generateImageNative(claimed.request);

    // Save image to Firebase Storage
    try {
      const bucket = admin.storage().bucket();
      const base64 = result.imageBase64?.split(',')[1] || '';
      const buffer = Buffer.from(base64, 'base64');
      const filename = `generated/${id}/output.png`;
      const file = bucket.file(filename);
      // Ensure parent folder exists — Cloud Storage is flat, this will create the object with the path
      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
      });
      const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });

      record.status = 'completed';
      record.imageUrl = url;
      record.model = result.model;
      await saveGenerationRecord(record);
      await jobQueue.markJobCompleted(id);
    } catch (err: any) {
      record.status = 'failed';
      record.error = `Failed to save image: ${err?.message ?? String(err)}`;
      await saveGenerationRecord(record);
      await jobQueue.markJobFailed(id, record.error);
    }
  } catch (err: any) {
    console.error('[comfyAdapter] Generation error:', err);
    record.status = 'failed';
    record.error = err?.message || String(err);
    await saveGenerationRecord(record);
    await jobQueue.markJobFailed(id, record.error);
  }

  return true;
}

export async function getJobStatus(generationId: string): Promise<GenerationRecord | null> {
  try {
    const db = admin.firestore();
    const doc = await db.collection(GEN_COLLECTION).doc(generationId).get();
    if (!doc.exists) return null;
    return doc.data() as GenerationRecord;
  } catch (err: any) {
    console.warn('[comfyAdapter] getJobStatus failed:', err?.message || err);
    return null;
  }
}

export default {
  healthCheck,
  getSystemStats,
  generateImage,
  getJobStatus,
};
