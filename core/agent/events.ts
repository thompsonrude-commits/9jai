import { EventEmitter } from 'events';

export const agentEvents = new EventEmitter();

export type AgentEventTypes =
  | 'AgentRegistered'
  | 'GoalDecomposed'
  | 'WorkflowCreated'
  | 'TaskAssigned'
  | 'TaskStarted'
  | 'TaskCompleted'
  | 'TaskFailed'
  | 'WorkflowPaused'
  | 'WorkflowResumed'
  | 'WorkflowCompleted'
  | 'ApprovalRequested'
  | 'ApprovalResolved'
  | 'ReplanTriggered';
