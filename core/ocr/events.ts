import { EventEmitter } from 'events';
import type { OcrResult } from './types';

export type OcrEvent =
  | { type: 'OcrRequested'; requestId?: string }
  | { type: 'OcrCompleted'; requestId?: string; result: OcrResult }
  | { type: 'OcrFailed'; requestId?: string; reason: string };

class OcrEventBus extends EventEmitter {
  emitEvent(e: OcrEvent) {
    this.emit(e.type, e);
  }
}

export const ocrEvents = new OcrEventBus();
