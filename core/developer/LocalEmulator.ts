import type { AIOrchestrator } from '../orchestrator/index';
import type { EvaluationEngine } from '../evaluation/EvaluationEngine';

export class LocalEmulator {
  private running = false;

  constructor(private readonly orchestrator?: AIOrchestrator, private readonly evaluation?: EvaluationEngine) {}

  start(): string {
    this.running = true;
    return `Local emulator started at ${new Date().toISOString()}`;
  }

  stop(): string {
    this.running = false;
    return `Local emulator stopped at ${new Date().toISOString()}`;
  }

  isRunning(): boolean {
    return this.running;
  }

  emulateRequest(payload: Record<string, unknown>): Record<string, unknown> {
    return {
      status: this.running ? 'emulated' : 'stopped',
      payload,
      timestamp: new Date().toISOString(),
    };
  }
}
