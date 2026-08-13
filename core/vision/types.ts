export interface ImageInput {
  id?: string;
  userId?: string;
  buffer?: Uint8Array | null; // optional for tests
  url?: string;
  meta?: Record<string, any>;
}

export interface DetectedObject {
  id?: string;
  label: string;
  confidence: number;
  bbox?: { x: number; y: number; w: number; h: number };
  relations?: Array<{ toId?: string; relation: string }>;
}

export interface SceneMetadata {
  indoor?: boolean;
  environment?: string;
  activity?: string;
  weather?: string;
  timeOfDay?: string;
}

export interface ImageAnalysisResult {
  id?: string;
  description: string;
  objects: DetectedObject[];
  scene: SceneMetadata;
  confidence: number;
  metadata: Record<string, any>;
}
