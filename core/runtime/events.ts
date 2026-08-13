import { EventEmitter } from 'events';
import type { ModelRecord } from './types';

export type RuntimeEvent =
  | { type: 'ModelRegistered'; model: ModelRecord }
  | { type: 'ModelLoaded'; modelId: string }
  | { type: 'ModelUnloaded'; modelId: string }
  | { type: 'ModelActivated'; modelId: string }
  | { type: 'ModelDeactivated'; modelId: string }
  | { type: 'ModelUpdated'; modelId: string }
  | { type: 'ModelUnregistered'; modelId: string }
  | { type: 'ModelFailed'; modelId: string; reason?: string }
  | { type: 'RuntimeStarted' }
  | { type: 'RuntimeStopped' }
  | { type: 'RuntimeHealthChanged'; health: unknown };

class RuntimeEventBus extends EventEmitter {
  emitEvent(e: RuntimeEvent) {
    this.emit(e.type, e);
  }
}

export const runtimeEvents = new RuntimeEventBus();
