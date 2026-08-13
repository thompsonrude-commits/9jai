import { describe, it, expect } from 'vitest';
import { AIOrchestrator } from '../../orchestrator/index';
import { DefaultCapabilityRegistry } from '../../capabilities/CapabilityRegistry';
import { AgentRegistry } from '../registry';
import { WorkflowManager } from '../WorkflowManager';
import { AgentPlanner } from '../planner';
import { AgentExecutor } from '../executor';

describe('AMAWIE agent workflow', () => {
  it('creates a workflow from a goal and executes tasks through orchestrator adapters', async () => {
    const orchestrator = new AIOrchestrator();
    orchestrator.registry.register({ capabilityId: 'planning', name: 'planning', description: 'plan tasks', category: 'utility', inputTypes: ['text/plain'], outputTypes: ['application/json'], version: '0.1.0', pluginId: 'core.agent', priority: 50 });
    orchestrator.registry.register({ capabilityId: 'language', name: 'language', description: 'language task', category: 'language', inputTypes: ['text/plain'], outputTypes: ['text/plain'], version: '0.1.0', pluginId: 'core.agent', priority: 50 });

    orchestrator.registerAdapter({ engineId: 'planning.agent', capability: 'planning', execute: async () => ({ success: true }) });
    orchestrator.registerAdapter({ engineId: 'language.agent', capability: 'language', execute: async () => ({ success: true }) });

    orchestrator.scheduler.start();

    const registry = new AgentRegistry();
    registry.register({ agentId: 'agent-planner', name: 'Planning Agent', role: 'planning', capabilities: ['planning'], pluginId: 'core.agent' });
    registry.register({ agentId: 'agent-writer', name: 'Language Agent', role: 'specialist', capabilities: ['language'], pluginId: 'core.agent' });

    const planner = new AgentPlanner(registry);
    const plan = planner.decomposeGoal('Create a launch deck');
    expect(plan.tasks.length).toBeGreaterThan(0);

    const workflowManager = new WorkflowManager();
    const workflow = workflowManager.createWorkflow({ id: 'req-1', input: { goal: 'Create a launch deck' } }, 'Create a launch deck', plan.tasks as any);

    const executor = new AgentExecutor(orchestrator, workflowManager, registry);
    const result = await executor.executeWorkflow(workflow, { id: 'req-1', input: { goal: 'Create a launch deck' } });

    expect(result.workflowId).toBe(workflow.workflowId);
    expect(result.results).toEqual(expect.arrayContaining([{ taskId: expect.any(String), success: true }]));

    orchestrator.scheduler.stop();
  });
});
