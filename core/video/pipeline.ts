import type { MediaPipeline, MediaPipelineStage } from './types';

export class DefaultMediaPipeline implements MediaPipeline {
  private stages: MediaPipelineStage[] = [];

  registerStage(stage: MediaPipelineStage): void {
    this.stages.push(stage);
  }

  async execute(input: any, ctx?: any): Promise<any> {
    let data = input;
    for (const stage of this.stages) {
      data = await stage.run(data, ctx);
    }
    return data;
  }
}

export default DefaultMediaPipeline;
