import { videoEvents } from './events';
import type { VideoRequest, EditVideoRequest, AnalyzeVideoRequest, VideoResult, MediaPipeline } from './types';
import type { CapabilityRegistry, CapabilityDescriptor } from '../capabilities/CapabilityRegistry';
import type { AIOrchestrator } from '../orchestrator/index';
import type { ModelRuntime } from '../runtime/ModelRuntime';
import type { ModelManager } from '../modelManager/ModelManager';
import { DefaultMediaPipeline } from './pipeline';

export class VideoEngine {
  readonly id: string;
  readonly name: string;
  readonly pipeline: MediaPipeline;

  constructor(private readonly options: { id?: string; name?: string } = {}, private readonly registry?: CapabilityRegistry, private readonly orchestrator?: AIOrchestrator, private readonly runtime?: ModelRuntime, private readonly models?: ModelManager) {
    this.id = options.id ?? 'core.video.engine';
    this.name = options.name ?? 'Video Intelligence Engine';
    this.pipeline = new DefaultMediaPipeline();
    if (this.registry) this.registerCapabilities();
    if (this.orchestrator) this.registerAdapters();
    this.registerDefaultPipelineStages();
  }

  registerCapabilities() {
    const caps: CapabilityDescriptor[] = [
      {
        capabilityId: 'video.generate',
        name: 'Text-to-Video',
        description: 'Generate video from text prompts',
        category: 'video',
        inputTypes: ['text/plain'],
        outputTypes: ['video/mp4'],
        version: '0.1.0',
        pluginId: 'core.video',
        priority: 50,
      } as CapabilityDescriptor,
      {
        capabilityId: 'video.edit',
        name: 'Video Editing',
        description: 'Edit existing video or enhance with effects',
        category: 'video',
        inputTypes: ['video/*'],
        outputTypes: ['video/mp4'],
        version: '0.1.0',
        pluginId: 'core.video',
        priority: 50,
      } as CapabilityDescriptor,
      {
        capabilityId: 'video.analyze',
        name: 'Video Analysis',
        description: 'Analyze video content and generate metadata',
        category: 'vision',
        inputTypes: ['video/*'],
        outputTypes: ['application/json'],
        version: '0.1.0',
        pluginId: 'core.video',
        priority: 40,
        confidenceSupport: true,
      } as CapabilityDescriptor,
    ];
    for (const c of caps) this.registry?.register(c);
  }

  registerAdapters() {
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'video.generate', execute: (req) => this.generate(req.input) });
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'video.edit', execute: (req) => this.edit(req.input) });
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'video.analyze', execute: (req) => this.analyze(req.input) });
  }

  registerDefaultPipelineStages() {
    // placeholder stages — real implementations will be added later
    this.pipeline.registerStage({ id: 'prompt-understanding', run: async (input) => ({ ...input, understood: true }) });
    this.pipeline.registerStage({ id: 'storyboard', run: async (input) => ({ ...input, storyboard: [] }) });
    this.pipeline.registerStage({ id: 'frame-generator', run: async (input) => ({ ...input, frames: [] }) });
    this.pipeline.registerStage({ id: 'composer', run: async (input) => ({ ...input, video: 'stub-video-by-pipeline' }) });
  }

  async generate(req: VideoRequest): Promise<VideoResult> {
    const requestId = req.id ?? `video-gen-${Date.now()}`;
    videoEvents.emit('VideoRequested', { id: requestId });
    // run pipeline
    const out = await this.pipeline.execute({ ...req, requestId });
    return { id: requestId, artifacts: [out.video], metadata: { engine: this.id } };
  }

  async edit(req: EditVideoRequest): Promise<VideoResult> {
    const requestId = req.id ?? `video-edit-${Date.now()}`;
    videoEvents.emit('VideoRequested', { id: requestId });
    const out = await this.pipeline.execute({ ...req, requestId });
    return { id: requestId, artifacts: [out.video], metadata: { engine: this.id } };
  }

  async analyze(req: AnalyzeVideoRequest): Promise<VideoResult> {
    const requestId = req.id ?? `video-analyze-${Date.now()}`;
    videoEvents.emit('VideoRequested', { id: requestId });
    const runtimeModel = await this.runtime?.route({ capability: 'video.analyze', requestId });
    return { id: requestId, metadata: { engine: this.id, model: runtimeModel?.id, analysis: 'stub' } };
  }
}

export default VideoEngine;
