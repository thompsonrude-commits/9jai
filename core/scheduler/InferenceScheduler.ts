/**
 * InferenceScheduler.ts
 *
 * Phase 15 refinement: dedicated scheduler for AI workloads.
 * The scheduler coordinates queueing, prioritization, retries, cancellation,
 * concurrency, and future distributed execution.
 */

export type SchedulerPriority = 'low' | 'normal' | 'high' | 'critical';
export type SchedulerJobState = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface InferenceJob {
  id: string;
  capability: string;
  priority: SchedulerPriority;
  createdAt: string;
  timeoutMs?: number;
  preferredRuntime?: string;
  metadata?: Record<string, unknown>;
}

export interface SchedulerStatus {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface InferenceScheduler {
  enqueue(job: InferenceJob): Promise<string>;
  cancel(jobId: string): Promise<void>;
  getStatus(): Promise<SchedulerStatus>;
  getQueue(): Promise<InferenceJob[]>;
  shutdown(): Promise<void>;
}

export class DefaultInferenceScheduler implements InferenceScheduler {
  private readonly jobs: InferenceJob[] = [];

  async enqueue(job: InferenceJob): Promise<string> {
    this.jobs.push(job);
    return job.id;
  }

  async cancel(jobId: string): Promise<void> {
    const index = this.jobs.findIndex((job) => job.id === jobId);
    if (index >= 0) {
      this.jobs.splice(index, 1);
    }
  }

  async getStatus(): Promise<SchedulerStatus> {
    return {
      queued: this.jobs.length,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
  }

  async getQueue(): Promise<InferenceJob[]> {
    return [...this.jobs];
  }

  async shutdown(): Promise<void> {
    this.jobs.splice(0, this.jobs.length);
  }
}
