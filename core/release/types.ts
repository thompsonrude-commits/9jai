export interface ReleaseManifest {
  version: string;
  channel: 'stable' | 'rc' | 'beta' | 'lts';
  summary: string;
  signed: boolean;
  artifacts: string[];
  generatedAt: number;
}

export interface ReleaseRequest {
  version: string;
  channel: ReleaseManifest['channel'];
  summary: string;
}

export interface PackageArtifact {
  name: string;
  version: string;
  checksum: string;
  signed: boolean;
  format: string;
  createdAt: number;
}

export interface ConfigurationValidationResult {
  valid: boolean;
  issues: string[];
}

export interface UpgradePlan {
  fromVersion: string;
  toVersion: string;
  steps: string[];
}

export interface RollbackPlan {
  version: string;
  steps: string[];
}

export interface DependencyAuditResult {
  dependencies: Array<{ name: string; version: string; status: 'ok' | 'warning' | 'critical' }>;
  issues: string[];
}

export interface CompatibilityResult {
  compatible: boolean;
  warnings: string[];
}

export interface CertificationResult {
  version: string;
  ready: boolean;
  score: number;
  notes: string[];
}

export interface ReleaseEngineeringService {
  createRelease(request: ReleaseRequest): Promise<ReleaseManifest>;
}

export interface PackagingService {
  buildArtifact(input: { name: string; version: string }): Promise<PackageArtifact>;
}

export interface ConfigurationValidator {
  validate(input: { env: Record<string, string>; secrets: Record<string, string>; connectors: Record<string, unknown> }): Promise<ConfigurationValidationResult>;
}

export interface UpgradePlanner {
  plan(input: { fromVersion: string; toVersion: string }): Promise<UpgradePlan>;
}

export interface RollbackPlanner {
  plan(input: { version: string }): Promise<RollbackPlan>;
}

export interface DependencyAuditor {
  audit(dependencies: Array<{ name: string; version: string }>): Promise<DependencyAuditResult>;
}

export interface CompatibilityChecker {
  check(input: { fromVersion: string; toVersion: string }): Promise<CompatibilityResult>;
}

export interface ReleaseCertificationEngine {
  certify(input: { version: string; dependencies: Array<{ name: string; version: string; status: 'ok' | 'warning' | 'critical' }>; compatibility: CompatibilityResult }): Promise<CertificationResult>;
}
