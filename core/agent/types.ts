import type { CapabilityDescriptor } from '../capabilities/CapabilityRegistry';

export type AgentRole =
  | 'master'
  | 'specialist'
  | 'verification'
  | 'scheduler'
  | 'delivery'
  | 'planning';

export interface AgentDescriptor {
  agentId: string;
  name: string;
  role: AgentRole;
  description?: string;
  capabilities: string[];
  version?: string;
  pluginId: string;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'awaiting_approval';

export interface WorkflowTask {
  taskId: string;
  name: string;
  capability: string;
  input: any;
  assignedAgentId?: string;
  status: TaskStatus;
  dependencies: string[];
  result?: any;
  retries: number;
  approvalRequired?: boolean;
}

export interface WorkflowDefinition {
  workflowId: string;
  requestId: string;
  goal: string;
  tasks: WorkflowTask[];
  state: 'created' | 'running' | 'paused' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  approvalHistory: Array<{ taskId: string; approved: boolean; by: string; at: number }>;
  metadata: Record<string, any>;
}

export interface WorkflowContext {
  sessionId?: string;
  userId?: string;
  memory?: any;
  knowledge?: any;
  preferences?: any;
}

export interface GoalPlan {
  goal: string;
  tasks: Array<Pick<WorkflowTask, 'taskId' | 'name' | 'capability' | 'input' | 'dependencies' | 'approvalRequired'>>;
}

export interface ApprovalDecision {
  workflowId: string;
  taskId: string;
  approved: boolean;
  reviewerId: string;
}
