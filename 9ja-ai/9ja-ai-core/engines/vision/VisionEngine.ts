export interface VisionEngine {
  understandImage(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  detectObjects(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  recognizeLandmarks(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  recognizeProducts(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  analyzeScene(request: Record<string, unknown>): Promise<Record<string, unknown>>;
  compareImages(request: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface VisionFinding {
  label: string;
  category: string;
  confidence: number;
  explanation?: string;
  uncertain?: boolean;
}

export interface VisionModelRequest {
  operation: 'understand' | 'objects' | 'landmarks' | 'products' | 'scene' | 'compare';
  prompt?: string;
  image?: unknown;
  images?: unknown[];
  metadata?: Record<string, unknown>;
}

export interface VisionModelResponse {
  findings?: VisionFinding[];
  summary?: string;
  confidence?: number;
  uncertainty?: string;
  metadata?: Record<string, unknown>;
}

export interface VisionModelAdapter {
  analyze(request: VisionModelRequest): Promise<VisionModelResponse>;
}

export interface VisionEngineDependencies {
  modelAdapter?: VisionModelAdapter;
}

export class VisionEngineAdapter implements VisionEngine {
  private readonly modelAdapter: VisionModelAdapter;

  constructor(dependencies: VisionEngineDependencies = {}) {
    this.modelAdapter = dependencies.modelAdapter ?? new DefaultVisionModelAdapter();
  }

  public async understandImage(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('understand', request);
  }

  public async detectObjects(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('objects', request);
  }

  public async recognizeLandmarks(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('landmarks', request);
  }

  public async recognizeProducts(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('products', request);
  }

  public async analyzeScene(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.execute('scene', request);
  }

  public async compareImages(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await this.execute('compare', request);
    const metadata = this.normalizeRecord(response.metadata);
    return {
      ...response,
      metadata: {
        ...metadata,
        comparisonMode: 'multi-image',
      },
    };
  }

  private async execute(operation: VisionModelRequest['operation'], request: Record<string, unknown>): Promise<Record<string, unknown>> {
    const modelRequest: VisionModelRequest = {
      operation,
      prompt: typeof request.prompt === 'string' ? request.prompt : undefined,
      image: request.image,
      images: Array.isArray(request.images) ? request.images : undefined,
      metadata: this.normalizeRecord(request.metadata),
    };

    const response = await this.modelAdapter.analyze(modelRequest);
    const findings = (response.findings ?? []).map((finding) => ({
      ...finding,
      explanation: finding.explanation ?? this.buildExplanation(finding),
      uncertain: finding.uncertain ?? finding.confidence < 0.6,
    }));

    return {
      operation,
      findings,
      summary: response.summary ?? 'Analysis completed.',
      confidence: response.confidence ?? this.averageConfidence(findings),
      uncertainty: response.uncertainty ?? this.buildUncertainty(findings),
      metadata: {
        ...(response.metadata ?? {}),
        ...modelRequest.metadata,
      },
    };
  }

  private averageConfidence(findings: VisionFinding[]): number {
    if (findings.length === 0) {
      return 0;
    }

    return findings.reduce((total, finding) => total + finding.confidence, 0) / findings.length;
  }

  private buildExplanation(finding: VisionFinding): string {
    if (finding.confidence < 0.6) {
      return `Confidence is low (${finding.confidence.toFixed(2)}). The prediction may be uncertain.`;
    }

    return `High-confidence match for ${finding.label}.`;
  }

  private buildUncertainty(findings: VisionFinding[]): string | undefined {
    const uncertainFindings = findings.filter((finding) => finding.confidence < 0.6);
    if (uncertainFindings.length === 0) {
      return undefined;
    }

    return `Some results are uncertain because confidence is below 0.6.`;
  }

  private normalizeRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}

class DefaultVisionModelAdapter implements VisionModelAdapter {
  public async analyze(request: VisionModelRequest): Promise<VisionModelResponse> {
    return {
      findings: [
        {
          label: 'default-scene',
          category: 'scene',
          confidence: 0.82,
          explanation: 'Default analysis completed with normal confidence.',
          uncertain: false,
        },
      ],
      summary: `Default vision response for ${request.operation}.`,
      confidence: 0.82,
      uncertainty: undefined,
      metadata: {
        source: 'default-vision-model',
      },
    };
  }
}
