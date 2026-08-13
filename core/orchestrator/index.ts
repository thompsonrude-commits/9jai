import { RequestGateway } from './requestGateway';
import { IntentAnalyzer } from './intentAnalyzer';
import { CapabilityResolver } from './capabilityResolver';
import { WorkflowCoordinator } from './workflowCoordinator';
import { ContextManager } from './contextManager';
import { ResponseAggregator } from './responseAggregator';
import { StreamingManager } from './streamingManager';
import { ErrorCoordinator } from './errorCoordinator';
import { Audit } from './audit';
import InferenceScheduler from '../scheduler';
import type { OrchestratorRequest, EngineResponse } from './types';
import { DefaultPluginManager } from '../plugins/PluginManager';
import type { PluginManager } from '../plugins/PluginManager';
import { DefaultCapabilityRegistry } from '../capabilities/CapabilityRegistry';
import type { CapabilityRegistry } from '../capabilities/CapabilityRegistry';

export type EngineAdapter = { engineId: string; capability: string; execute: (req: OrchestratorRequest) => Promise<any> };

export class AIOrchestrator {
  gateway = new RequestGateway();
  intent = new IntentAnalyzer();
  resolver = new CapabilityResolver();
  workflow = new WorkflowCoordinator();
  context = new ContextManager();
  aggregator = new ResponseAggregator();
  streaming = new StreamingManager();
  errorer = new ErrorCoordinator();
  audit = new Audit();
  scheduler: InferenceScheduler;
  adapters = new Map<string, EngineAdapter>();
  pluginManager: PluginManager;
  registry: CapabilityRegistry;

  constructor(scheduler?: InferenceScheduler, pluginManager?: PluginManager, registry?: CapabilityRegistry) {
    this.scheduler = scheduler ?? new InferenceScheduler();
    this.registry = registry ?? new DefaultCapabilityRegistry();
    this.pluginManager = pluginManager ?? new DefaultPluginManager(this.registry);
    this.resolver = new CapabilityResolver(this.registry);

    // default scheduler handler delegates to registered adapters
    this.scheduler.registerHandler(async (job, ctx) => {
      const cap = job.type || job.payload?.capability;
      const adapter = this.adapters.get(String(cap));
      if (!adapter) throw new Error('No adapter for capability ' + cap);
      return adapter.execute({ id: job.id, input: job.payload, sessionId: job.payload?.sessionId });
    });
  }

  registerAdapter(adapter: EngineAdapter) {
    this.adapters.set(adapter.capability, adapter);
  }

  async handleRequest(raw: OrchestratorRequest) {
    if (!this.gateway.validate(raw)) throw new Error('Invalid request');
    const req = this.gateway.normalize(raw);
    const intents = this.intent.analyze(req);
    const caps = this.resolver.resolve(intents);
    const pipeline = this.workflow.buildPipeline(req, caps);
    this.audit.record({ requestId: req.id, timestamp: req.timestamp, pipeline });

    const responses: EngineResponse[] = [];

    for (const step of pipeline) {
      // submit to scheduler and wait for completion for now
      const jobId = this.scheduler.submit({ id: `${req.id}:${step.capability}`, type: step.capability, priority: 50, payload: { ...req.input, sessionId: req.sessionId } });
      // poll job status
      let finished = false;
      while (!finished) {
        const j = this.scheduler.listJobs().find((x: any) => x.id === jobId);
        if (!j) break;
        if (j.status === 'completed') {
          finished = true;
          responses.push({ engineId: step.engineId ?? 'unknown', capability: step.capability, data: { success: true } });
        } else if (j.status === 'failed' || j.status === 'cancelled' || j.status === 'timed_out') {
          finished = true;
          responses.push({ engineId: step.engineId ?? 'unknown', capability: step.capability, data: { success: false } });
        } else {
          await new Promise((r) => setTimeout(r, 20));
        }
      }
    }

    this.workflow.complete(req.id ?? '');
    const aggregated = this.aggregator.aggregate(req.id ?? '', responses as any);
    this.audit.record({ requestId: req.id, result: aggregated });
    return aggregated;
  }
}

export default AIOrchestrator;
