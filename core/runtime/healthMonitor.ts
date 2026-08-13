import { ResourceManager } from './resourceManager';
import type { RuntimeHealth } from './types';
import { ModelRegistry } from './modelRegistry';

export class HealthMonitor {
  private startTime = Date.now();
  constructor(private resourceManager: ResourceManager, private registry: ModelRegistry) {}

  async getHealth(): Promise<RuntimeHealth> {
    const uptimeSeconds = Math.round((Date.now() - this.startTime) / 1000);
    const memoryUsageMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const cpuLoadPercent = this.resourceManager.estimateCpuLoad();
    const loadedModels = this.registry.listByStatus('loaded').length;
    const activeModels = this.registry.listByStatus('active').length;
    return {
      uptimeSeconds,
      loadedModels,
      activeModels,
      memoryUsageMb,
      cpuLoadPercent,
      lastUpdated: new Date().toISOString(),
    };
  }
}
