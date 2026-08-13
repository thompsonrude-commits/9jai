import { schedulerEvents } from './events';

export class ProgressTracker {
  report(jobId: string, progress: number, stage?: string) {
    schedulerEvents.emitEvent({ type: 'JobProgress', jobId, progress, stage });
  }
}
