/**
 * ModelRuntime.ts
 *
 * Runtime-centric model layer for routing requests to the best available model.
 * This implementation is intentionally lightweight but adds validation, health
 * reporting, and preferred-model selection so it can be used in production-like
 * tests and service integrations.
 */

export type RuntimeExecutionMode = 'local' | 'remote' | 'hybrid';
export type RuntimeHealthStatus = 'healthy' | 'degraded' | 'unavailable';

export interface RuntimeRequestContext {
  capability: string;
  requestId: string;
  preferredModel?: string;
  maxConcurrency?: number;
  traceId?: string;
}

export interface RuntimeModelDescriptor {
  id: string;
  name: string;
  capabilities: string[];
  executionMode: RuntimeExecutionMode;
  isActive: boolean;
  version?: string;
  status?: 'registered' | 'active' | 'inactive' | 'failed';
}

export interface RuntimeHealthReport {
  runtimeId: string;
  status: RuntimeHealthStatus;
  activeModels: number;
  queueDepth: number;
  lastUpdated: string;
}

export interface ModelRuntime {
  initialize(): Promise<void>;
  registerModel(model: RuntimeModelDescriptor): void;
  route(context: RuntimeRequestContext): Promise<RuntimeModelDescriptor | undefined>;
  getHealth(): Promise<RuntimeHealthReport>;
  shutdown(): Promise<void>;
}

export class DefaultModelRuntime implements ModelRuntime {
  private readonly models = new Map<string, RuntimeModelDescriptor>();

  async initialize(): Promise<void> {
    this.models.clear();
  }

  registerModel(model: RuntimeModelDescriptor): void {
    if (!model.id || !model.name) throw new Error('Model descriptor must include id and name');
    if (this.models.has(model.id)) throw new Error(`Model ${model.id} already registered`);
    this.models.set(model.id, { ...model, status: model.isActive ? 'active' : 'inactive' });
  }

  async route(context: RuntimeRequestContext): Promise<RuntimeModelDescriptor | undefined> {
    const candidates = Array.from(this.models.values()).filter(
      (model) => model.capabilities.includes(context.capability) && model.isActive && model.status !== 'failed',
    );

    if (context.preferredModel) {
      const preferred = candidates.find((model) => model.id === context.preferredModel);
      if (preferred) return preferred;
    }

    return candidates.sort((a, b) => Number(b.isActive) - Number(a.isActive)).at(0);
  }

  async getHealth(): Promise<RuntimeHealthReport> {
    const activeModels = Array.from(this.models.values()).filter((model) => model.isActive).length;
    const status: RuntimeHealthStatus = activeModels > 0 ? 'healthy' : 'degraded';
    return {
      runtimeId: 'default-runtime',
      status,
      activeModels,
      queueDepth: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  async shutdown(): Promise<void> {
    this.models.clear();
  }
}
