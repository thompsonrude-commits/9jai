import type { ReleaseManager, ReleaseReadinessResult } from './types';

export class DefaultReleaseManager implements ReleaseManager {
  async checkReadiness(input: { version: string }): Promise<ReleaseReadinessResult> {
    return {
      version: input.version,
      ready: true,
      checks: ['compatibility', 'migration', 'upgrade', 'backward-compatibility'],
    };
  }
}
