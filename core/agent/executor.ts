import type { WorkflowDefinition } from './types';
import { agentEvents } from './events';
import type { AgentRegistry } from './registry';
import type { AIOrchestrator } from '../orchestrator/index';
import type { WorkflowManager } from './WorkflowManager';
import type { OrchestratorRequest } from '../orchestrator/types';

export class AgentExecutor {
  constructor(private readonly orchestrator: AIOrchestrator, private readonly workflowManager: WorkflowManager, private readonly agentRegistry: AgentRegistry) {}

  async executeWorkflow(workflow: WorkflowDefinition, req: OrchestratorRequest): Promise<any> {
    const results: any[] = [];
    for (const task of workflow.tasks) {
      if (task.status === 'completed') continue;
      if (task.dependencies.some((dep) => workflow.tasks.find((t) => t.taskId === dep)?.status !== 'completed')) {
        continue;
      }

      const agents = this.agentRegistry.findByCapability(task.capability);
      const assignedAgent = agents[0];
      if (!assignedAgent) {
        this.workflowManager.markTaskFailed(workflow.workflowId, task.taskId, `No agent for capability ${task.capability}`);
        continue;
      }

      this.workflowManager.assignTask(workflow.workflowId, task.taskId, assignedAgent.agentId);
      this.workflowManager.markTaskStarted(workflow.workflowId, task.taskId);
      agentEvents.emit('TaskStarted', { workflowId: workflow.workflowId, taskId: task.taskId, agentId: assignedAgent.agentId });

      try {
        const jobId = this.orchestrator.scheduler.submit({ id: `${workflow.workflowId}:${task.taskId}`, type: task.capability, priority: 50, payload: { ...task.input, sessionId: req.sessionId } });
        let done = false;
        while (!done) {
          const j = this.orchestrator.scheduler.listJobs().find((x: any) => x.id === jobId);
          if (!j) break;
          if (j.status === 'completed') {
            done = true;
            this.workflowManager.markTaskCompleted(workflow.workflowId, task.taskId, { success: true });
            results.push({ taskId: task.taskId, success: true });
          } else if (['failed', 'timed_out', 'cancelled'].includes(j.status)) {
            done = true;
            this.workflowManager.markTaskFailed(workflow.workflowId, task.taskId, j.failureReason);
            results.push({ taskId: task.taskId, success: false, reason: j.failureReason });
          } else {
            await new Promise((r) => setTimeout(r, 20));
          }
        }
      } catch (err: any) {
        this.workflowManager.markTaskFailed(workflow.workflowId, task.taskId, err);
        results.push({ taskId: task.taskId, success: false, reason: String(err) });
      }
    }

    if (workflow.tasks.every((t) => t.status === 'completed')) {
      this.workflowManager.completeWorkflow(workflow.workflowId);
    }

    return { workflowId: workflow.workflowId, results };
  }
}

export default AgentExecutor;
