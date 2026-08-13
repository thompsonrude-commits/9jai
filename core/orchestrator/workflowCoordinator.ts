import type { OrchestratorRequest } from './types';
import { orchestratorEvents } from './events';

export type PipelineStep = { capability: string; engineId?: string };

export class WorkflowCoordinator {
  // builds a pipeline (ordered steps) given resolved capabilities
  buildPipeline(req: OrchestratorRequest, capabilities: string[]): PipelineStep[] {
    // simple pipeline: execute all capabilities in order
    const pipeline = capabilities.map((c) => ({ capability: c }));
    orchestratorEvents.emitEvent({ type: 'WorkflowStarted', requestId: req.id ?? '' });
    return pipeline;
  }

  complete(requestId: string) {
    orchestratorEvents.emitEvent({ type: 'WorkflowCompleted', requestId });
  }
}
