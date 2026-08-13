import type { ExecutionPlan, UnifiedRequest } from './types';
import { pipelineEvents } from './events';
import type { AIOrchestrator } from '../orchestrator/index';

export class PipelineExecutor {
  constructor(private readonly orchestrator?: AIOrchestrator) {}

  async execute(plan: ExecutionPlan, req: UnifiedRequest): Promise<any> {
    pipelineEvents.emit('StepStarted', { plan, requestId: plan.requestId });
    if (!this.orchestrator) {
      pipelineEvents.emit('PipelineCompleted', { requestId: plan.requestId, result: null });
      return { id: plan.requestId, results: [] };
    }

    const jobs = plan.steps.map((s) => {
      const jobId = this.orchestrator!.scheduler.submit({ id: `${plan.requestId}:${s.capability}`, type: s.capability, priority: 50, payload: { ...req.input, sessionId: req.sessionId } as any });
      return { step: s, jobId };
    });

    // wait for all jobs to finish (simple polling)
    const results: any[] = [];
    const pending = new Set(jobs.map((j) => j.jobId));

    while (pending.size > 0) {
      const list = this.orchestrator!.scheduler.listJobs();
      for (const j of jobs) {
        if (!pending.has(j.jobId)) continue;
        const rec = list.find((x: any) => x.id === j.jobId);
        if (!rec) continue;
        if (rec.status === 'completed') {
          pending.delete(j.jobId);
          results.push({ capability: j.step.capability, success: true });
          pipelineEvents.emit('StepCompleted', { requestId: plan.requestId, capability: j.step.capability });
        } else if (rec.status === 'failed' || rec.status === 'timed_out' || rec.status === 'cancelled') {
          pending.delete(j.jobId);
          results.push({ capability: j.step.capability, success: false, reason: rec.failureReason });
          pipelineEvents.emit('StepCompleted', { requestId: plan.requestId, capability: j.step.capability, failed: true });
        }
      }
      if (pending.size > 0) await new Promise((r) => setTimeout(r, 20));
    }

    pipelineEvents.emit('PipelineCompleted', { requestId: plan.requestId, result: results });
    return { id: plan.requestId, results };
  }
}

export default PipelineExecutor;
