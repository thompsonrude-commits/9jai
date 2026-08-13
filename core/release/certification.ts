import type { CertificationResult, CompatibilityResult, ReleaseCertificationEngine } from './types';

export class DefaultReleaseCertificationEngine implements ReleaseCertificationEngine {
  async certify(input: { version: string; dependencies: Array<{ name: string; version: string; status: 'ok' | 'warning' | 'critical' }>; compatibility: CompatibilityResult }): Promise<CertificationResult> {
    const critical = input.dependencies.filter((dependency) => dependency.status === 'critical').length;
    const warnings = input.dependencies.filter((dependency) => dependency.status === 'warning').length;
    const score = Math.max(0, 100 - critical * 40 - warnings * 10);
    const notes = [] as string[];
    if (critical > 0) notes.push('Critical dependency issues detected');
    if (!input.compatibility.compatible) notes.push('Compatibility check failed');
    if (notes.length === 0) notes.push('Release is ready for certification');
    return {
      version: input.version,
      ready: critical === 0 && input.compatibility.compatible,
      score,
      notes,
    };
  }
}
