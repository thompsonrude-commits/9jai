import * as admin from 'firebase-admin';

const QUEUE_COLLECTION = 'image_queue';
const LOCK_DOC = 'gpu_lock';

export interface QueueEntry {
  id: string;
  request: any;
  createdAt: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts?: number;
  userId?: string;
}

export async function enqueueJob(entry: QueueEntry): Promise<void> {
  const db = admin.firestore();
  const docRef = db.collection(QUEUE_COLLECTION).doc(entry.id);
  await docRef.set(entry, { merge: false });
}

/**
 * Claim the next job atomically. Returns the job doc data or null if none available.
 * This uses a transaction to find a queued job and set it to processing.
 */
export async function claimNextJob(): Promise<QueueEntry | null> {
  const db = admin.firestore();

  // Very small query to find one queued job ordered by createdAt
  const q = db.collection(QUEUE_COLLECTION).where('status', '==', 'queued').orderBy('createdAt', 'asc').limit(1);
  const snap = await q.get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data() as QueueEntry;

  // Try to claim via transaction to avoid races
  const docRef = doc.ref;
  try {
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(docRef);
      if (!fresh.exists) throw new Error('job disappeared');
      const cur = fresh.data() as QueueEntry;
      if (cur.status !== 'queued') throw new Error('job already claimed');
      tx.update(docRef, { status: 'processing', attempts: (cur.attempts || 0) + 1 });
    });

    // Return claimed job with updated status
    const claimed = (await docRef.get()).data() as QueueEntry;
    return claimed;
  } catch (err) {
    // Another worker claimed it
    return null;
  }
}

export async function markJobCompleted(id: string, info?: Partial<QueueEntry>) {
  const db = admin.firestore();
  await db.collection(QUEUE_COLLECTION).doc(id).set({ status: 'completed', ...info, completedAt: Date.now() }, { merge: true });
}

export async function markJobFailed(id: string, errorMessage?: string) {
  const db = admin.firestore();
  await db.collection(QUEUE_COLLECTION).doc(id).set({ status: 'failed', error: errorMessage, updatedAt: Date.now() }, { merge: true });
}

export async function cancelJob(id: string, reason?: string) {
  const db = admin.firestore();
  await db.collection(QUEUE_COLLECTION).doc(id).set({ status: 'cancelled', cancelReason: reason, updatedAt: Date.now() }, { merge: true });
}

export async function getQueueStats() {
  const db = admin.firestore();
  const queuedSnap = await db.collection(QUEUE_COLLECTION).where('status', '==', 'queued').get();
  const processingSnap = await db.collection(QUEUE_COLLECTION).where('status', '==', 'processing').get();
  const failedSnap = await db.collection(QUEUE_COLLECTION).where('status', '==', 'failed').get();
  return {
    queued: queuedSnap.size,
    processing: processingSnap.size,
    failed: failedSnap.size,
  };
}
