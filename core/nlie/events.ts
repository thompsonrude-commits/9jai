import { EventEmitter } from 'events';
import type { NlieResult } from './types';

export type NlieEvent =
  | { type: 'NlieRequested'; requestId?: string }
  | { type: 'NlieCompleted'; requestId?: string; result: NlieResult }
  | { type: 'NlieFailed'; requestId?: string; reason: string };

class NlieEventBus extends EventEmitter {
  emitEvent(e: NlieEvent) {
    this.emit(e.type, e);
  }
}

export const nlieEvents = new NlieEventBus();
