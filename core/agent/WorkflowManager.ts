import type { WorkflowDefinition, WorkflowTask, ApprovalDecision } from './types';
import type { OrchestratorRequest } from '../orchestrator/types';
import { agentEvents } from './events';

export class WorkflowManager {
  private workflows = new Map<string, WorkflowDefinition>();

  createWorkflow(req: OrchestratorRequest, goal: string, tasks: WorkflowTask[]): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      workflowId: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestId: req.id ?? `req-${Date.now()}`,
      goal,
      tasks,
      state: 'created',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      approvalHistory: [],
      metadata: { sessionId: req.sessionId, userId: req.userId },
    };
    this.workflows.set(workflow.workflowId, workflow);
    agentEvents.emit('WorkflowCreated', workflow);
    return workflow;
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  updateWorkflow(workflow: WorkflowDefinition): void {
    workflow.updatedAt = Date.now();
    this.workflows.set(workflow.workflowId, workflow);
  }

  assignTask(workflowId: string, taskId: string, agentId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    const task = workflow.tasks.find((t) => t.taskId === taskId);
    if (!task) throw new Error('Task not found');
    task.assignedAgentId = agentId;
    task.status = 'pending';
    this.updateWorkflow(workflow);
    agentEvents.emit('TaskAssigned', { workflowId, taskId, agentId });
  }

  markTaskStarted(workflowId: string, taskId: string): void {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    const task = workflow.tasks.find((t) => t.taskId === taskId);
    if (!task) throw new Error('Task not found');
    task.status = 'running';
    this.updateWorkflow(workflow);
    agentEvents.emit('TaskStarted', { workflowId, taskId });
  }

  markTaskCompleted(workflowId: string, taskId: string, result: any): void {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    const task = workflow.tasks.find((t) => t.taskId === taskId);
    if (!task) throw new Error('Task not found');
    task.status = 'completed';
    task.result = result;
    this.updateWorkflow(workflow);
    agentEvents.emit('TaskCompleted', { workflowId, taskId, result });
  }

  markTaskFailed(workflowId: string, taskId: string, error: any): void {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    const task = workflow.tasks.find((t) => t.taskId === taskId);
    if (!task) throw new Error('Task not found');
    task.status = 'failed';
    task.result = { error: String(error) };
    task.retries += 1;
    this.updateWorkflow(workflow);
    agentEvents.emit('TaskFailed', { workflowId, taskId, error });
  }

  requestApproval(workflowId: string, taskId: string): void {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    const task = workflow.tasks.find((t) => t.taskId === taskId);
    if (!task) throw new Error('Task not found');
    task.status = 'awaiting_approval';
    this.updateWorkflow(workflow);
    agentEvents.emit('ApprovalRequested', { workflowId, taskId });
  }

  resolveApproval(decision: ApprovalDecision): void {
    const workflow = this.getWorkflow(decision.workflowId);
    if (!workflow) throw new Error('Workflow not found');
    const task = workflow.tasks.find((t) => t.taskId === decision.taskId);
    if (!task) throw new Error('Task not found');
    workflow.approvalHistory.push({ taskId: decision.taskId, approved: decision.approved, by: decision.reviewerId, at: Date.now() });
    task.status = decision.approved ? 'pending' : 'failed';
    this.updateWorkflow(workflow);
    agentEvents.emit('ApprovalResolved', { workflowId: decision.workflowId, taskId: decision.taskId, approved: decision.approved });
  }

  completeWorkflow(workflowId: string): void {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow not found');
    workflow.state = 'completed';
    this.updateWorkflow(workflow);
    agentEvents.emit('WorkflowCompleted', workflow);
  }
}

export default WorkflowManager;
