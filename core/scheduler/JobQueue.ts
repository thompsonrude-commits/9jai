import type { JobRequest, JobRecord } from './types';

export class JobQueue {
  private queue: JobRecord[] = [];

  enqueue(job: JobRecord) {
    this.queue.push(job);
    // keep highest priority first (lower number = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
  }

  dequeue(): JobRecord | undefined {
    const now = Date.now();
    // skip scheduled future jobs
    for (let i = 0; i < this.queue.length; i++) {
      const j = this.queue[i];
      if (!j.scheduledAt || j.scheduledAt <= now) {
        return this.queue.splice(i, 1)[0];
      }
    }
    return undefined;
  }

  peek(): JobRecord | undefined {
    return this.queue[0];
  }

  inspect(): JobRecord[] {
    return [...this.queue];
  }

  size(): number {
    return this.queue.length;
  }
}
