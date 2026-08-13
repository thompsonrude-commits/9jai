import type { CompatibilityChecker, CompatibilityResult } from './types';

export class DefaultCompatibilityChecker implements CompatibilityChecker {
  async check(input: { fromVersion: string; toVersion: string }): Promise<CompatibilityResult> {
    const compatible = input.toVersion.localeCompare(input.fromVersion, undefined, { numeric: true }) >= 0;
    return {
      compatible,
      warnings: compatible ? [] : ['Downgrade detected; validate compatibility matrix'],
    };
  }
}
