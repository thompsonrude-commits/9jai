import type { AIOrchestrator } from '../orchestrator/index';

export interface UnifiedRequest {
  id?: string;
  input?: any;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export type PipelineStep = { capability: string; engineId?: string; parallel?: boolean };

export interface ExecutionPlan {
  requestId: string;
  steps: PipelineStep[];
}

export interface UnifiedPipelineOptions {
  orchestrator?: AIOrchestrator;
}
