import type { AgentDescriptor } from './types';
import { agentEvents } from './events';

export class AgentRegistry {
  private agents = new Map<string, AgentDescriptor>();

  register(agent: AgentDescriptor) {
    this.agents.set(agent.agentId, agent);
    agentEvents.emit('AgentRegistered', agent);
  }

  get(agentId: string): AgentDescriptor | undefined {
    return this.agents.get(agentId);
  }

  list(): AgentDescriptor[] {
    return Array.from(this.agents.values());
  }

  findByCapability(capability: string): AgentDescriptor[] {
    return this.list().filter((agent) => agent.capabilities.includes(capability));
  }
}

export default AgentRegistry;
