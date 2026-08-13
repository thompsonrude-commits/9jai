import { EventEmitter } from 'events';
import type { ModelDescriptor, ModelHealth, ModelBenchmark, ModelStatus } from './types';

export type ModelManagerEvent =
  | { type: 'ModelDiscovered'; model: ModelDescriptor }
  | { type: 'ModelRegistered'; model: ModelDescriptor }
  | { type: 'ModelValidated'; modelId: string; result: { valid: boolean; errors: string[] } }
  | { type: 'ModelReady'; modelId: string }
  | { type: 'ModelLoading'; modelId: string }
  | { type: 'ModelLoaded'; modelId: string }
  | { type: 'ModelSelected'; modelId: string; criteria: unknown }
  | { type: 'ModelUpdated'; modelId: string; patch: Partial<ModelDescriptor> }
  | { type: 'ModelDeprecated'; modelId: string }
  | { type: 'ModelDisabled'; modelId: string }
  | { type: 'ModelFailed'; modelId: string; reason?: string }
  | { type: 'ModelHealthChanged'; modelId: string; health: ModelHealth }
  | { type: 'ModelBenchmarkRecorded'; modelId: string; benchmark: ModelBenchmark };

class ModelManagerEventBus extends EventEmitter {
  emitEvent(event: ModelManagerEvent) {
    this.emit(event.type, event);
  }
}

export const modelEvents = new ModelManagerEventBus();
