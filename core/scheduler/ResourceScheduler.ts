import { ResourceManager } from '../runtime/resourceManager';
import { schedulerEvents } from './events';

export class ResourceScheduler {
  private runtimeRes: ResourceManager;
  private allocations = new Map<string, number>();

  constructor(runtimeRes?: ResourceManager) {
    this.runtimeRes = runtimeRes ?? new ResourceManager();
  }

  async reserve(jobId: string, mb = 0): Promise<boolean> {
    const ok = await this.runtimeRes.reserve(jobId, mb);
    if (ok) {
      this.allocations.set(jobId, mb);
      schedulerEvents.emitEvent({ type: 'ResourceAllocated', jobId, resources: { mb } });
    }
    return ok;
  }

  release(jobId: string) {
    if (this.allocations.has(jobId)) {
      this.allocations.delete(jobId);
      this.runtimeRes.release(jobId);
      schedulerEvents.emitEvent({ type: 'ResourceReleased', jobId });
    }
  }

  getAllocations() {
    return Array.from(this.allocations.entries()).map(([jobId, r]) => ({ jobId, resources: r }));
  }
}
