import type { JobRequest, JobRecord } from './types';

export class JobManager {
  private jobs = new Map<string, JobRecord>();

  createFromRequest(req: JobRequest): JobRecord {
    const rec: JobRecord = {
      ...req,
      status: 'queued',
      attempts: 0,
      assigned: null,
      createdAt: Date.now(),
    };
    this.jobs.set(rec.id, rec);
    return rec;
  }

  update(jobId: string, patch: Partial<JobRecord>) {
    const j = this.jobs.get(jobId);
    if (!j) return null;
    const updated = Object.assign(j, patch);
    this.jobs.set(jobId, updated);
    return updated;
  }

  get(jobId: string) {
    return this.jobs.get(jobId) || null;
  }

  list() {
    return Array.from(this.jobs.values());
  }
}
