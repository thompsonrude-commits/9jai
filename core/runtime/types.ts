export type Capability =
  | 'chat'
  | 'coding'
  | 'translation'
  | 'ocr'
  | 'vision'
  | 'image-generation'
  | 'image-editing'
  | 'video-generation'
  | 'speech-recognition'
  | 'text-to-speech'
  | 'embeddings';

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  capabilities: Capability[];
  license?: string;
  hardware: {
    cpuCores?: number;
    ramMb?: number;
    gpuMemoryMb?: number;
  };
  config?: Record<string, unknown>;
  installedAt?: string;
}

export type ModelStatus = 'registered' | 'loaded' | 'active' | 'inactive' | 'failed' | 'unloaded';

export interface ModelRecord extends ModelMetadata {
  status: ModelStatus;
  lastUpdated?: string;
  error?: string;
}

export interface RuntimeHealth {
  uptimeSeconds: number;
  loadedModels: number;
  activeModels: number;
  memoryUsageMb: number;
  cpuLoadPercent: number;
  lastUpdated: string;
}
