import { DefaultCapabilityRegistry } from '../capabilities/CapabilityRegistry';
import type { CapabilityRegistry, CapabilityDescriptor } from '../capabilities/CapabilityRegistry';

export class CapabilityRegistryBridge {
  private readonly registry: CapabilityRegistry;

  constructor(registry?: CapabilityRegistry) {
    this.registry = registry ?? new DefaultCapabilityRegistry();
  }

  registerCapability(descriptor: CapabilityDescriptor): void {
    this.registry.register(descriptor);
  }

  unregisterCapability(capabilityId: string): void {
    this.registry.unregister(capabilityId);
  }

  getCapability(capabilityId: string): CapabilityDescriptor | undefined {
    return this.registry.get(capabilityId);
  }

  listCapabilities(): CapabilityDescriptor[] {
    return this.registry.list();
  }
}
