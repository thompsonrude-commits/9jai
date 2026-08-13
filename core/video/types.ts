export interface StoryboardScene {
  id?: string;
  description: string;
  durationMs?: number;
  camera?: Record<string, any>;
  lighting?: Record<string, any>;
  characters?: string[];
  environment?: string;
}

export interface VideoRequest {
  id?: string;
  prompt?: string;
  scenes?: StoryboardScene[];
  options?: Record<string, any>;
}

export interface EditVideoRequest {
  id?: string;
  source: any; // path or buffer
  instructions?: string;
  options?: Record<string, any>;
}

export interface AnalyzeVideoRequest {
  id?: string;
  source: any;
  options?: Record<string, any>;
}

export interface VideoResult {
  id?: string;
  artifacts?: any[]; // paths or buffers
  metadata?: Record<string, any>;
  warnings?: string[];
}

export interface MediaPipelineStage {
  id: string;
  description?: string;
  run(input: any, ctx?: any): Promise<any>;
}

export interface MediaPipeline {
  registerStage(stage: MediaPipelineStage): void;
  execute(input: any, ctx?: any): Promise<any>;
}
