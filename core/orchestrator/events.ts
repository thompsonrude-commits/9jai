import { EventEmitter } from 'events';
import type { OrchestratorRequest } from './types';

export type OrchestratorEvent =
  | { type: 'RequestReceived'; req: OrchestratorRequest }
  | { type: 'IntentDetected'; requestId: string; intents: any[] }
  | { type: 'CapabilityResolved'; requestId: string; capabilities: string[] }
  | { type: 'WorkflowStarted'; requestId: string }
  | { type: 'WorkflowCompleted'; requestId: string }
  | { type: 'ResponseChunk'; requestId: string; chunk: any }
  | { type: 'RequestFailed'; requestId: string; error: any };

class OrchestratorBus extends EventEmitter {
  emitEvent(e: OrchestratorEvent) {
    this.emit(e.type, e);
  }
}

export const orchestratorEvents = new OrchestratorBus();
