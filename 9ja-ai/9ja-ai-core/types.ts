export type EngineKind =
  | 'language'
  | 'vision'
  | 'image'
  | 'video'
  | 'speech'
  | 'translation'
  | 'memory'
  | 'ocr';

export type RequestPriority = 'low' | 'normal' | 'high';
export type ModelHealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type ModelRuntimeStatus = 'registered' | 'loading' | 'ready' | 'unloading' | 'failed';

export interface AIRequest {
  id: string;
  source: 'android-app' | 'web' | 'api' | 'internal';
  kind: EngineKind;
  operation: string;
  payload: Record<string, unknown>;
  stream?: boolean;
  priority?: RequestPriority;
  metadata?: Record<string, unknown>;
}

export interface AIResponse {
  requestId: string;
  status: 'accepted' | 'queued' | 'completed' | 'failed';
  engine: EngineKind;
  operation: string;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ModelDescriptor {
  id: string;
  family: string;
  version: string;
  capabilities: EngineKind[];
  location: string;
  enabled: boolean;
}

export interface ModelRuntimeState {
  modelId: string;
  status: ModelRuntimeStatus;
  health: ModelHealthStatus;
  capabilities: EngineKind[];
  loadedAt?: string;
  lastCheckedAt?: string;
  details?: string;
}

export interface RuntimeSelectionCriteria {
  kind: EngineKind;
  requiredCapabilities?: EngineKind[];
  preferredModelIds?: string[];
  preferHealthy?: boolean;
}

export interface InferenceJob {
  id: string;
  requestId: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
