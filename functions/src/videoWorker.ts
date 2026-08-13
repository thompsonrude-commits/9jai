export type VideoJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface VideoWorkerRequest {
  prompt: string;
  image?: string;
  duration?: number;
  width?: number;
  height?: number;
  model?: string;
}

export interface VideoWorkerJob {
  jobId: string;
  workerJobId?: string;
  status: VideoJobStatus;
  videoUrl?: string;
  mimeType?: string;
  model?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

interface WorkerResponse {
  jobId?: string;
  status?: VideoJobStatus;
  videoUrl?: string;
  mimeType?: string;
  model?: string;
  error?: string;
}

const jobs = new Map<string, VideoWorkerJob>();
const maxJobs = 1000;

function workerUrl(): string | undefined {
  const value = process.env.VIDEO_WORKER_URL?.trim();
  return value ? value.replace(/\/+$/, '') : undefined;
}

function resolveWorkerVideoUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const base = workerUrl();
  return base ? `${base}/${value.replace(/^\/+/, '')}` : value;
}

function workerHeaders(): Record<string, string> {
  const token = process.env.VIDEO_WORKER_TOKEN?.trim();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function createJob(): VideoWorkerJob {
  if (jobs.size >= maxJobs) {
    const oldest = [...jobs.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) jobs.delete(oldest.jobId);
  }
  const now = Date.now();
  const job = {
    jobId: `video_${now}_${Math.random().toString(36).slice(2, 10)}`,
    status: 'queued' as VideoJobStatus,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.jobId, job);
  return job;
}

function updateJob(jobId: string, patch: Partial<VideoWorkerJob>): VideoWorkerJob {
  const current = jobs.get(jobId);
  if (!current) throw new Error('Video job not found');
  const updated = { ...current, ...patch, updatedAt: Date.now() };
  jobs.set(jobId, updated);
  return updated;
}

async function workerRequest(path: string, init?: RequestInit): Promise<WorkerResponse> {
  const base = workerUrl();
  if (!base) {
    throw new Error('Video generation is temporarily unavailable because no video inference worker is currently online.');
  }
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...workerHeaders(), ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(Number(process.env.VIDEO_WORKER_TIMEOUT ?? 120000)),
  });
  const text = await response.text();
  let data: WorkerResponse = {};
  if (text) {
    try {
      data = JSON.parse(text) as WorkerResponse;
    } catch {
      throw new Error(`Video worker returned invalid JSON (${response.status})`);
    }
  }
  if (!response.ok) {
    throw new Error(data.error || `Video worker returned HTTP ${response.status}`);
  }
  return data;
}

export async function submitVideoJob(request: VideoWorkerRequest): Promise<VideoWorkerJob> {
  const job = createJob();
  try {
    const result = await workerRequest('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!result.jobId && !result.videoUrl) {
      throw new Error('Video worker did not return a job ID or video URL');
    }
    if (result.videoUrl) {
      return updateJob(job.jobId, {
        status: 'completed',
        videoUrl: resolveWorkerVideoUrl(result.videoUrl),
        mimeType: result.mimeType || 'video/mp4',
        model: result.model || request.model,
      });
    }
    return updateJob(job.jobId, {
      status: result.status || 'processing',
      workerJobId: result.jobId,
      model: result.model || request.model,
    });
  } catch (error) {
    updateJob(job.jobId, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function refreshVideoJob(jobId: string): Promise<VideoWorkerJob> {
  const current = jobs.get(jobId);
  if (!current) throw new Error('Video job not found');
  if (current.status === 'completed' || current.status === 'failed' || current.status === 'cancelled') return current;

  try {
    const result = await workerRequest(`/status/${encodeURIComponent(current.workerJobId || jobId)}`);
    return updateJob(jobId, {
      status: result.status || current.status,
      videoUrl: resolveWorkerVideoUrl(result.videoUrl),
      mimeType: result.mimeType || (result.videoUrl ? 'video/mp4' : undefined),
      model: result.model || current.model,
      error: result.error,
    });
  } catch (error) {
    return updateJob(jobId, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
  }
}

export async function getVideoWorkerHealth(): Promise<Record<string, unknown>> {
  try {
    return await workerRequest('/health') as Record<string, unknown>;
  } catch (error) {
    return {
      status: 'offline',
      error: error instanceof Error ? error.message : String(error),
      textToVideo: false,
      imageToVideo: false,
    };
  }
}

export function getVideoJob(jobId: string): VideoWorkerJob | undefined {
  return jobs.get(jobId);
}
