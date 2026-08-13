import { EventEmitter } from 'events';
import type { SttResult, TtsResult } from './types';

export type SpeechEvent =
  | { type: 'SpeechRequested'; requestId?: string }
  | { type: 'SttCompleted'; requestId?: string; result: SttResult }
  | { type: 'TtsCompleted'; requestId?: string; result: TtsResult }
  | { type: 'SpeechFailed'; requestId?: string; reason: string };

class SpeechEventBus extends EventEmitter {
  emitEvent(e: SpeechEvent) {
    this.emit(e.type, e);
  }
}

export const speechEvents = new SpeechEventBus();
