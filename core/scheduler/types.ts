export type JobPriority = number;

export type JobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out';

export interface JobPayload {
  [key: string]: any;
}

export interface JobRequest {
  id: string;
  type: string;
  priority: JobPriority;
  payload?: JobPayload;
  scheduledAt?: number; // epoch ms
  timeoutMs?: number;
  maxRetries?: number;
}

export interface JobRecord extends JobRequest {
  status: JobStatus;
  attempts: number;
  assigned?: {
    modelId?: string;
    engineId?: string;
    resources?: any;
  } | null;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  failureReason?: string;
}
