export type ModelCategory = string;
export type ModelTask = string;

export type ModelStatus =
  | 'discovered'
  | 'registered'
  | 'validated'
  | 'ready'
  | 'loading'
  | 'loaded'
  | 'busy'
  | 'idle'
  | 'updating'
  | 'deprecated'
  | 'disabled'
  | 'failed';

export interface ModelHardwareRequirements {
  cpuCores?: number;
  minRamMb?: number;
  gpuRequired?: boolean;
  gpuMemoryMb?: number;
  diskSpaceMb?: number;
}

export interface ModelHealth {
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown';
  lastSuccessfulExecution?: string;
  lastFailure?: string;
  errorCount: number;
  validationStatus: 'passed' | 'failed' | 'pending';
  validationErrors?: string[];
  availability: boolean;
}

export interface ModelBenchmark {
  loadTimeMs: number;
  inferenceLatencyMs: number;
  throughput?: number;
  memoryUsageMb?: number;
  cpuUsagePercent?: number;
  gpuUsagePercent?: number;
  successRate: number;
  failureRate: number;
  timestamp: string;
}

export interface ModelDescriptor {
  id: string;
  name: string;
  category: ModelCategory;
  version: string;
  provider: string;
  filePath: string;
  sizeBytes?: number;
  supportedTasks: ModelTask[];
  supportedLanguages?: string[];
  requiredHardware?: ModelHardwareRequirements;
  minRamMb?: number;
  gpuSupport?: boolean;
  cpuSupport?: boolean;
  quantization?: string;
  license?: string;
  status: ModelStatus;
  installedAt?: string;
  lastValidatedAt?: string;
  lastUsedAt?: string;
  health?: ModelHealth;
  metadata?: Record<string, unknown>;
  tags?: string[];
  source?: 'local' | 'remote' | 'hybrid' | string;
  checksum?: string;
  signature?: string;
}

export interface ModelDiscoveryOptions {
  searchPaths: string[];
  manifestFileNames?: string[];
  recursive?: boolean;
}

export interface ModelSelectionCriteria {
  task: ModelTask;
  category?: ModelCategory;
  preferredProvider?: string;
  requiredGpu?: boolean;
  allowDeprecated?: boolean;
  maxMemoryMb?: number;
  supportedLanguage?: string;
  preferHealth?: boolean;
  userPreferences?: {
    providerOrder?: string[];
    preferLocalModels?: boolean;
  };
}

export interface ModelValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ModelSecurityProvider {
  verifyChecksum?(filePath: string, checksum: string): Promise<boolean>;
  verifySignature?(signature: string): Promise<boolean>;
  validateLicense?(license: string): Promise<boolean>;
  isTrustedSource?(source: string): Promise<boolean>;
}

export interface ResourceStatus {
  cpuCores: number;
  availableRamMb: number;
  availableDiskMb: number;
  totalRamMb?: number;
  gpuAvailable: boolean;
  powerSavingMode: boolean;
  thermalState?: string;
}

export interface ModelManagerOptions {
  discoveryPaths?: string[];
  securityProvider?: ModelSecurityProvider;
}

export interface ModelRegistryUpdate {
  status?: ModelStatus;
  lastValidatedAt?: string;
  lastUsedAt?: string;
  health?: Partial<ModelHealth>;
  metadata?: Record<string, unknown>;
  tags?: string[];
  version?: string;
  license?: string;
  filePath?: string;
  checksum?: string;
  signature?: string;
}
