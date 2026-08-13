import { JobQueue } from './JobQueue';
import { JobManager } from './JobManager';
import { PriorityManager } from './PriorityManager';
import { ResourceScheduler } from './ResourceScheduler';
import { RetryManager } from './RetryManager';
import { CancellationManager } from './CancellationManager';
import { ProgressTracker } from './ProgressTracker';
import { schedulerEvents } from './events';
import type { JobRequest, JobRecord } from './types';

export type JobHandler = (job: JobRecord, ctx: { cancelToken: any; progress: (n: number, stage?: string) => void }) => Promise<any>;

export class InferenceScheduler {
  private queue = new JobQueue();
  private manager = new JobManager();
  private priority = new PriorityManager();
  private resource = new ResourceScheduler();
  private retry = new RetryManager();
  private cancel = new CancellationManager();
  private progress = new ProgressTracker();
  private running = false;
  private handler?: JobHandler;

  constructor(handler?: JobHandler) {
    this.handler = handler;
  }

  start() {
    if (this.running) return;
    this.running = true;
    schedulerEvents.emitEvent({ type: 'SchedulerStarted' });
    this.loop();
  }

  stop() {
    this.running = false;
    schedulerEvents.emitEvent({ type: 'SchedulerStopped' });
  }

  submit(req: JobRequest) {
    const jobRec = this.manager.createFromRequest({ ...req, priority: req.priority ?? this.priority.getPriority(req.type) });
    this.queue.enqueue(jobRec);
    schedulerEvents.emitEvent({ type: 'JobQueued', job: jobRec });
    return jobRec.id;
  }

  async loop() {
    while (this.running) {
      try {
        const job = this.queue.dequeue();
        if (!job) {
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }

        if (this.cancel.isCancelled(job.id)) {
          job.status = 'cancelled';
          this.manager.update(job.id, job);
          schedulerEvents.emitEvent({ type: 'JobCancelled', job });
          continue;
        }

        // Reserve resources (naive: use a field in payload)
        const neededMb = job.payload?.requiredRamMb ?? 0;
        const reserved = await this.resource.reserve(job.id, neededMb);
        if (!reserved) {
          // requeue with delay
          job.scheduledAt = Date.now() + 200;
          this.queue.enqueue(job);
          continue;
        }

        job.status = 'running';
        job.startedAt = Date.now();
        job.attempts = (job.attempts || 0) + 1;
        this.manager.update(job.id, job);
        schedulerEvents.emitEvent({ type: 'JobStarted', job });

        const cancelToken = this.cancel.createToken(job.id);

        const progressCb = (n: number, stage?: string) => {
          this.progress.report(job.id, n, stage);
        };

        let finished = false;
        try {
          if (!this.handler) throw new Error('No job handler registered');
          const p = this.handler(job, { cancelToken, progress: progressCb });

          let timeoutId: any;
          if (job.timeoutMs) {
            const t = new Promise((_, rej) => {
              timeoutId = setTimeout(() => rej(new Error('timeout')), job.timeoutMs);
            });
            await Promise.race([p, t]);
            clearTimeout(timeoutId);
          } else {
            await p;
          }

          finished = true;
          job.status = 'completed';
          job.completedAt = Date.now();
          this.manager.update(job.id, job);
          schedulerEvents.emitEvent({ type: 'JobCompleted', job });
        } catch (err: any) {
          job.failureReason = err?.message;
          if (err?.message === 'timeout') job.status = 'timed_out';
          else job.status = 'failed';
          this.manager.update(job.id, job);
          schedulerEvents.emitEvent({ type: 'JobFailed', job, reason: err?.message });

          // retry logic
          if (this.retry.shouldRetry(job.attempts) && (job.maxRetries ?? 0) > job.attempts - 1) {
            job.scheduledAt = Date.now() + this.retry.backoff(job.attempts);
            job.status = 'queued';
            this.queue.enqueue(job);
          }
        } finally {
          if (!finished) this.resource.release(job.id);
          this.cancel.clear(job.id);
        }
      } catch (e) {
        // emit but keep loop alive
        // eslint-disable-next-line no-console
        console.error('Scheduler loop error', e);
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }

  registerHandler(h: JobHandler) {
    this.handler = h;
  }

  cancelJob(jobId: string) {
    this.cancel.cancel(jobId);
  }

  listJobs() {
    return this.manager.list();
  }

  inspectQueue() {
    return this.queue.inspect();
  }
}

export default InferenceScheduler;
