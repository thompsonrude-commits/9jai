import type { GoalPlan } from './types';
import type { OrchestratorRequest } from '../orchestrator/types';
import type { AgentRegistry } from './registry';
import { agentEvents } from './events';

const defaultSpecialists: Array<{ role: string; capability: string; taskName: string }> = [
  { role: 'planning', capability: 'planning', taskName: 'Plan workflow' },
  { role: 'vision', capability: 'vision', taskName: 'Analyze images' },
  { role: 'ocr', capability: 'ocr', taskName: 'Scan documents' },
  { role: 'speech', capability: 'speech', taskName: 'Process audio' },
  { role: 'image', capability: 'image.generate', taskName: 'Generate images' },
  { role: 'video', capability: 'video.generate', taskName: 'Generate videos' },
  { role: 'language', capability: 'language', taskName: 'Compose text' },
  { role: 'memory', capability: 'memory', taskName: 'Reference memory' },
];

export class AgentPlanner {
  constructor(private readonly registry: AgentRegistry) {}

  decomposeGoal(goal: string): GoalPlan {
    const tasks = defaultSpecialists.map((spec) => ({
      taskId: `task-${spec.capability}-${Math.random().toString(36).slice(2, 6)}`,
      name: spec.taskName,
      capability: spec.capability,
      input: { goal },
      dependencies: [],
      approvalRequired: false,
    }));

    const plan: GoalPlan = { goal, tasks };
    agentEvents.emit('GoalDecomposed', plan);
    return plan;
  }
}

export default AgentPlanner;
