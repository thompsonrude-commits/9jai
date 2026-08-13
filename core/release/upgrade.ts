import type { UpgradePlan, UpgradePlanner } from './types';

export class DefaultUpgradePlanner implements UpgradePlanner {
  async plan(input: { fromVersion: string; toVersion: string }): Promise<UpgradePlan> {
    return {
      fromVersion: input.fromVersion,
      toVersion: input.toVersion,
      steps: [
        `Validate configuration from ${input.fromVersion}`,
        `Apply database migrations for ${input.toVersion}`,
        `Upgrade plugins and connectors`,
        `Run smoke tests`,
      ],
    };
  }
}
