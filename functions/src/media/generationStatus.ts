import * as admin from 'firebase-admin';

type Status = 'queued' | 'generating' | 'completed' | 'failed';

export interface GenerationStatusRecord {
  id: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
  provider: string;
  imageUrl?: string;
  error?: string;
}

const IN_MEMORY = new Map<string, GenerationStatusRecord>();
const COLLECTION = 'image_generations';

export async function createStatus(id: string, provider = 'comfyui') {
  const now = Date.now();
  const rec: GenerationStatusRecord = { id, status: 'queued', createdAt: now, updatedAt: now, provider };
  IN_MEMORY.set(id, rec);
  try {
    await admin.firestore().collection(COLLECTION).doc(id).set(rec, { merge: true });
  } catch (err: any) {
    console.warn('[generationStatus] failed to persist create:', err?.message || err);
  }
  return rec;
}

export async function updateStatus(id: string, status: Status, opts?: { imageUrl?: string; error?: string }) {
  const now = Date.now();
  const existing = IN_MEMORY.get(id) || { id, status, createdAt: now, updatedAt: now, provider: 'comfyui' };
  existing.status = status;
  existing.updatedAt = now;
  if (opts?.imageUrl) existing.imageUrl = opts.imageUrl;
  if (opts?.error) existing.error = opts.error;
  IN_MEMORY.set(id, existing);

  try {
    await admin.firestore().collection(COLLECTION).doc(id).set(existing, { merge: true });
  } catch (err: any) {
    console.warn('[generationStatus] failed to persist update:', err?.message || err);
  }

  return existing;
}

export async function getStatus(id: string): Promise<GenerationStatusRecord | null> {
  const inMem = IN_MEMORY.get(id);
  if (inMem) return inMem;
  try {
    const doc = await admin.firestore().collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as GenerationStatusRecord;
    IN_MEMORY.set(id, data);
    return data;
  } catch (err: any) {
    console.warn('[generationStatus] getStatus failed:', err?.message || err);
    return null;
  }
}
