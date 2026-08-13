import * as os from 'os';
import { runtimeEvents } from './events';

export class ResourceManager {
  private reserved = new Map<string, number>();

  estimateMemoryMb(): number {
    const total = Math.round(os.totalmem() / 1024 / 1024);
    const used = Math.round(process.memoryUsage().rss / 1024 / 1024);
    return Math.max(0, total - used);
  }

  estimateCpuLoad(): number {
    const loads = os.loadavg()[0] ?? 0;
    const cpuCount = Math.max(1, os.cpus().length);
    return Math.min(100, Math.round((loads / cpuCount) * 100));
  }

  async reserve(jobId: string, mb: number): Promise<boolean> {
    const availableMb = this.estimateMemoryMb();
    const currentlyReserved = Array.from(this.reserved.values()).reduce((sum, value) => sum + value, 0);
    const headroom = availableMb - currentlyReserved;
    const success = mb <= headroom;
    if (success) {
      this.reserved.set(jobId, mb);
    }
    runtimeEvents.emitEvent({ type: 'RuntimeHealthChanged', health: { jobId, reservedMb: mb, availableMb, headroom, success } });
    return success;
  }

  release(jobId: string): void {
    if (this.reserved.has(jobId)) {
      this.reserved.delete(jobId);
      runtimeEvents.emitEvent({ type: 'RuntimeHealthChanged', health: { jobId, released: true } });
    }
  }

  getReservedMemory(): number {
    return Array.from(this.reserved.values()).reduce((sum, value) => sum + value, 0);
  }
}
