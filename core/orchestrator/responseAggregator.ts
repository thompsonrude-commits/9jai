import type { EngineResponse, StandardResponse } from './types';

export class ResponseAggregator {
  aggregate(requestId: string, responses: EngineResponse[]): StandardResponse {
    return { requestId, responses, status: 'ok' };
  }
}
