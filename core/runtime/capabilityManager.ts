import type { Capability } from './types';

export class CapabilityManager {
  private cap = new Map<string, Capability[]>();

  registerModelCapabilities(modelId: string, capabilities: Capability[]) {
    this.cap.set(modelId, capabilities);
  }

  unregisterModel(modelId: string) {
    this.cap.delete(modelId);
  }

  getCapabilities(modelId: string): Capability[] {
    return this.cap.get(modelId) ?? [];
  }

  findModelsFor(capability: Capability): string[] {
    const matches: string[] = [];
    for (const [id, caps] of this.cap.entries()) {
      if (caps.includes(capability)) matches.push(id);
    }
    return matches;
  }
}
