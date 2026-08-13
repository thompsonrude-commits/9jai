import type { RollbackPlan, RollbackPlanner } from './types';

export class DefaultRollbackPlanner implements RollbackPlanner {
  async plan(input: { version: string }): Promise<RollbackPlan> {
    return {
      version: input.version,
      steps: [
        `Stop traffic for ${input.version}`,
        `Restore previous stable release`,
        `Re-run health checks`,
      ],
    };
  }
}
