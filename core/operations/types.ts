export interface DashboardOverview {
  platformHealth: 'healthy' | 'degraded' | 'critical';
  activeServices: number;
  runningWorkflows: number;
  connectedUsers: number;
  connectedAgents: number;
  connectedModels: number;
  clusterHealth: 'healthy' | 'degraded' | 'critical';
  securityStatus: 'secure' | 'warning' | 'critical';
  benchmarkScore: number;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  kind: string;
  config?: Record<string, unknown>;
}

export interface MetricSample {
  name: string;
  value: number;
  unit?: string;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  correlationId?: string;
  timestamp: number;
}

export interface AlertRecord {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  timestamp: number;
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  timestamp: number;
}

export interface ConfigurationEntry {
  key: string;
  value: string;
}

export interface ReportDocument {
  format: 'pdf' | 'html' | 'markdown' | 'csv' | 'json';
  title: string;
  content: string;
}

export interface ReleaseReadinessResult {
  version: string;
  ready: boolean;
  checks: string[];
}

export interface DashboardEngine {
  getOverview(): Promise<DashboardOverview>;
}

export interface WidgetFramework {
  register(widget: WidgetDefinition): Promise<void>;
  render(widgetId: string): WidgetDefinition | undefined;
}

export interface MetricsAggregator {
  record(sample: MetricSample): void;
  summary(): Record<string, number>;
}

export interface LogAggregationEngine {
  ingest(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void>;
  search(query: string): Promise<LogEntry[]>;
}

export interface AlertManager {
  raise(alert: Omit<AlertRecord, 'id' | 'timestamp' | 'acknowledged'>): Promise<AlertRecord>;
  acknowledge(id: string): Promise<void>;
  list(): AlertRecord[];
}

export interface IncidentManager {
  create(incident: Omit<IncidentRecord, 'id' | 'timestamp'>): Promise<IncidentRecord>;
  update(id: string, patch: Partial<IncidentRecord>): Promise<IncidentRecord | undefined>;
  list(): IncidentRecord[];
}

export interface ConfigurationService {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
}

export interface ReportGenerator {
  generate(report: Omit<ReportDocument, 'content'>): ReportDocument;
}

export interface SearchEngine {
  search(query: string): Promise<string[]>;
}

export interface ReleaseManager {
  checkReadiness(input: { version: string }): Promise<ReleaseReadinessResult>;
}
