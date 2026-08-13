import type { ReportDocument, ReportGenerator } from './types';

export class DefaultReportGenerator implements ReportGenerator {
  generate(report: Omit<ReportDocument, 'content'>): ReportDocument {
    return {
      format: report.format,
      title: report.title,
      content: `# ${report.title}\n\nGenerated for ${report.format}`,
    };
  }
}
