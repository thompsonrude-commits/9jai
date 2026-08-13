import type { UnifiedRequest, ExecutionPlan } from './types';
import type { AIOrchestrator } from '../orchestrator/index';
import { pipelineEvents } from './events';

export class PipelinePlanner {
  constructor(private readonly orchestrator?: AIOrchestrator) {}

  plan(req: UnifiedRequest): ExecutionPlan {
    // Use orchestrator intent/resolver/workflow to produce a pipeline when available
    const requestId = req.id ?? `req-${Date.now()}`;
    if (!this.orchestrator) {
      const plan: ExecutionPlan = { requestId, steps: [] };
      pipelineEvents.emit('PlanCreated', plan);
      return plan;
    }

    const intents = this.orchestrator.intent.analyze({ id: requestId, input: req.input });
    const caps = this.orchestrator.resolver.resolve(intents);
    const steps = this.orchestrator.workflow.buildPipeline({ id: requestId, input: req.input } as any, caps as any);
    const plan: ExecutionPlan = { requestId, steps: steps as any };
    pipelineEvents.emit('PlanCreated', plan);
    return plan;
  }
}

export default PipelinePlanner;
