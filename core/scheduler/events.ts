import { EventEmitter } from 'events';
import type { JobRecord } from './types';

export type SchedulerEvent =
  | { type: 'JobQueued'; job: JobRecord }
  | { type: 'JobStarted'; job: JobRecord }
  | { type: 'JobProgress'; jobId: string; progress: number; stage?: string }
  | { type: 'JobCompleted'; job: JobRecord }
  | { type: 'JobCancelled'; job: JobRecord }
  | { type: 'JobFailed'; job: JobRecord; reason?: string }
  | { type: 'ResourceAllocated'; jobId: string; resources: any }
  | { type: 'ResourceReleased'; jobId: string }
  | { type: 'SchedulerStarted' }
  | { type: 'SchedulerStopped' };

class SchedulerEventBus extends EventEmitter {
  emitEvent(e: SchedulerEvent) {
    this.emit(e.type, e);
  }
}

export const schedulerEvents = new SchedulerEventBus();
