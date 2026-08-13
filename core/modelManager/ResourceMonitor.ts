import * as os from 'os';
import { modelEvents } from './events';
import type { ResourceStatus, ModelHardwareRequirements } from './types';

export class ResourceMonitor {
  getStatus(): ResourceStatus {
    const cpus = os.cpus();
    const availableRamMb = Math.round(os.freemem() / 1024 / 1024);
    const totalRamMb = Math.round(os.totalmem() / 1024 / 1024);

    return {
      cpuCores: cpus.length,
      availableRamMb,
      availableDiskMb: this.estimateDiskSpaceMb(),
      gpuAvailable: false,
      powerSavingMode: false,
      thermalState: undefined,
      totalRamMb,
    };
  }

  async canSupport(requirements?: ModelHardwareRequirements): Promise<boolean> {
    if (!requirements) return true;
    const status = this.getStatus();

    if (requirements.cpuCores && requirements.cpuCores > status.cpuCores) {
      return false;
    }

    if (requirements.minRamMb && requirements.minRamMb > status.availableRamMb) {
      return false;
    }

    if (requirements.gpuRequired && !status.gpuAvailable) {
      return false;
    }

    if (requirements.gpuMemoryMb && !status.gpuAvailable) {
      return false;
    }

    if (requirements.diskSpaceMb && requirements.diskSpaceMb > status.availableDiskMb) {
      return false;
    }

    return true;
  }

  estimateDiskSpaceMb(): number {
    // Node.js does not expose a cross-platform disk free API directly.
    // Return a conservative placeholder so higher-level logic can still reason about available disk.
    return Math.round(os.freemem() / 1024 / 1024);
  }

  emitResourceChange(): void {
    modelEvents.emitEvent({ type: 'ModelHealthChanged', modelId: '', health: { status: 'unknown', errorCount: 0, validationStatus: 'pending', availability: false } });
  }
}
