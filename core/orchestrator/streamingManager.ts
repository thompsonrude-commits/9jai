import { orchestratorEvents } from './events';

export class StreamingManager {
  streamChunk(requestId: string, chunk: any) {
    orchestratorEvents.emitEvent({ type: 'ResponseChunk', requestId, chunk });
  }
}
