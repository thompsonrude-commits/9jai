import { v4 as uuidv4 } from 'uuid';
import type { OrchestratorRequest } from './types';
import { orchestratorEvents } from './events';

export class RequestGateway {
  validate(req: OrchestratorRequest) {
    if (!req) return false;
    if (!req.input) return false;
    return true;
  }

  normalize(req: OrchestratorRequest): OrchestratorRequest {
    const copy = { ...req };
    copy.id = copy.id ?? uuidv4();
    copy.timestamp = copy.timestamp ?? Date.now();
    orchestratorEvents.emitEvent({ type: 'RequestReceived', req: copy });
    return copy;
  }
}
