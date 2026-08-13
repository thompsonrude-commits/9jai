import type { EvaluationReport, BenchmarkResult, EvaluationRunContext } from './types';

export class ReportGenerator {
  generateReport(context: EvaluationRunContext, results: BenchmarkResult[], regressions: any[], recommendations: any[], comparison?: any): EvaluationReport {
    const total = results.length;
    const passed = results.filter((r) => r.success).length;
    const failed = total - passed;
    const avgScore = total > 0 ? results.reduce((acc, r) => acc + r.score, 0) / total : 0;

    return {
      reportId: `report-${context.runId}`,
      generatedAt: new Date().toISOString(),
      runContext: context,
      summary: {
        totalBenchmarks: total,
        passed,
        failed,
        averageScore: Number(avgScore.toFixed(2)),
        alerts: regressions.length,
      },
      results,
      regressions,
      recommendations,
      versionComparison: comparison,
    };
  }

  toMarkdown(report: EvaluationReport): string {
    const lines: string[] = [];
    lines.push(`# Evaluation Report ${report.reportId}`);
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push(`Suite: ${report.runContext.suiteId}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(`- Total benchmarks: ${report.summary.totalBenchmarks}`);
    lines.push(`- Passed: ${report.summary.passed}`);
    lines.push(`- Failed: ${report.summary.failed}`);
    lines.push(`- Average score: ${report.summary.averageScore}`);
    lines.push(`- Alerts: ${report.summary.alerts}`);
    lines.push('');
    lines.push('## Recommendations');
    for (const rec of report.recommendations) {
      lines.push(`- **${rec.title}** (${rec.category}, priority ${rec.priority})`);
      lines.push(`  - ${rec.description}`);
    }
    lines.push('');
    lines.push('## Regressions');
    for (const reg of report.regressions) {
      lines.push(`- **${reg.issue}** (${reg.severity})`);
    }
    return lines.join('\n');
  }
}
