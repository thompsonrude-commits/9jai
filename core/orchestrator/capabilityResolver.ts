import { DefaultCapabilityRegistry } from '../capabilities/CapabilityRegistry';
import type { Intent } from './types';
import type { CapabilityRegistry } from '../capabilities/CapabilityRegistry';
import { orchestratorEvents } from './events';

export class CapabilityResolver {
  constructor(private registry: CapabilityRegistry = new DefaultCapabilityRegistry()) {}

  resolve(intents: Intent[]) {
    const caps: string[] = [];
    for (const it of intents) {
      const candidate = this.registry.findBest({ capabilityId: it.name, name: it.name });
      if (candidate) caps.push(candidate.capabilityId);
    }
    orchestratorEvents.emitEvent({ type: 'CapabilityResolved', requestId: '', capabilities: caps });
    return caps;
  }
}
