export interface OrchestratorRequest {
  id?: string;
  sessionId?: string;
  userId?: string;
  type?: string; // optional explicit intent
  input?: any;
  timestamp?: number;
}

export type Intent = { name: string; confidence?: number };

export interface EngineResponse {
  engineId: string;
  capability: string;
  data: any;
  meta?: any;
}

export interface StandardResponse {
  requestId: string;
  responses: EngineResponse[];
  status: 'ok' | 'partial' | 'error';
  error?: any;
}
