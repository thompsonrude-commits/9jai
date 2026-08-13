import type { UnifiedPipelineOptions, UnifiedRequest } from './types';
import { PipelinePlanner } from './planner';
import { PipelineExecutor } from './executor';
import { pipelineEvents } from './events';

export class UnifiedPipeline {
  private planner: PipelinePlanner;
  private executor: PipelineExecutor;

  constructor(private readonly options: UnifiedPipelineOptions = {}) {
    this.planner = new PipelinePlanner(options.orchestrator);
    this.executor = new PipelineExecutor(options.orchestrator);
  }

  on(event: string | symbol, cb: (...args: any[]) => void) {
    pipelineEvents.on(event as string, cb);
  }

  async run(req: UnifiedRequest) {
    const plan = this.planner.plan(req);
    return this.executor.execute(plan, req);
  }
}

export default UnifiedPipeline;
