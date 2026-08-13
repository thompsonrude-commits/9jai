import type { DependencyAuditResult, DependencyAuditor } from './types';

export class DefaultDependencyAuditor implements DependencyAuditor {
  async audit(dependencies: Array<{ name: string; version: string }>): Promise<DependencyAuditResult> {
    const issues: string[] = [];
    const results = dependencies.map((dependency) => {
      if (dependency.version.startsWith('0.')) {
        issues.push(`${dependency.name} is using a pre-release version`);
        return { ...dependency, status: 'warning' as const };
      }
      return { ...dependency, status: 'ok' as const };
    });
    return { dependencies: results, issues };
  }
}
