import { imageEvents } from './events';
import type { GenerateRequest, EditRequest, AnalyzeRequest, ImageResult, ImageEngineOptions } from './types';
import type { CapabilityRegistry, CapabilityDescriptor } from '../capabilities/CapabilityRegistry';
import type { AIOrchestrator } from '../orchestrator/index';
import type { ModelRuntime } from '../runtime/ModelRuntime';
import type { ModelManager } from '../modelManager/ModelManager';

export class ImageEngine {
  readonly id: string;
  readonly name: string;

  constructor(private readonly options: ImageEngineOptions = {}, private readonly registry?: CapabilityRegistry, private readonly orchestrator?: AIOrchestrator, private readonly runtime?: ModelRuntime, private readonly models?: ModelManager) {
    this.id = options.id ?? 'core.image.engine';
    this.name = options.name ?? 'Image Intelligence Engine';
    if (this.registry) this.registerCapability();
    if (this.orchestrator) this.registerAdapter();
  }

  registerCapability() {
    const caps: CapabilityDescriptor[] = [
      {
        capabilityId: 'image.generate',
        name: 'Image Generation',
        description: 'Text-to-image generation supporting multiple styles and prompt controls',
        category: 'image',
        inputTypes: ['text/plain'],
        outputTypes: ['image/png', 'image/jpeg'],
        version: '0.1.0',
        pluginId: 'core.image',
        priority: 50,
        streaming: true,
      } as CapabilityDescriptor,
      {
        capabilityId: 'image.edit',
        name: 'Image Editing',
        description: 'Image-to-image editing, inpainting, outpainting, background replacement',
        category: 'image',
        inputTypes: ['image/*'],
        outputTypes: ['image/png', 'image/jpeg'],
        version: '0.1.0',
        pluginId: 'core.image',
        priority: 50,
      } as CapabilityDescriptor,
      {
        capabilityId: 'image.analyze',
        name: 'Image Analysis',
        description: 'Vision analysis, object detection, scene understanding, OCR integration',
        category: 'vision',
        inputTypes: ['image/*'],
        outputTypes: ['application/json'],
        version: '0.1.0',
        pluginId: 'core.image',
        priority: 40,
        confidenceSupport: true,
      } as CapabilityDescriptor,
    ];

    for (const c of caps) this.registry?.register(c);
  }

  registerAdapter() {
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'image.generate', execute: (req) => this.generate(req.input) });
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'image.edit', execute: (req) => this.edit(req.input) });
    this.orchestrator?.registerAdapter({ engineId: this.id, capability: 'image.analyze', execute: (req) => this.analyze(req.input) });
  }

  async generate(req: GenerateRequest): Promise<ImageResult> {
    const requestId = req.id ?? `image-gen-${Date.now()}`;
    imageEvents.emit('ImageGenerated', { id: requestId });
    const model = this.models?.selectModel({ task: 'image.generate' as any });
    if (!model) return { id: requestId, images: [], warnings: ['no-model-selected'] };
    const runtimeModel = await this.runtime?.route({ capability: 'image.generate', requestId, preferredModel: model?.id });
    // In production the runtimeModel would be used to execute inference. Here we return a stub.
    return { id: requestId, images: [`generated-image-by-${runtimeModel?.id ?? 'stub'}`], metadata: { engine: this.id, model: runtimeModel?.id } };
  }

  async edit(req: EditRequest): Promise<ImageResult> {
    const requestId = req.id ?? `image-edit-${Date.now()}`;
    imageEvents.emit('ImageEdited', { id: requestId });
    const model = this.models?.selectModel({ task: 'image.edit' as any });
    if (!model) return { id: requestId, images: [], warnings: ['no-model-selected'] };
    const runtimeModel = await this.runtime?.route({ capability: 'image.edit', requestId, preferredModel: model?.id });
    return { id: requestId, images: [`edited-image-by-${runtimeModel?.id ?? 'stub'}`], metadata: { engine: this.id, model: runtimeModel?.id } };
  }

  async analyze(req: AnalyzeRequest): Promise<ImageResult> {
    const requestId = req.id ?? `image-analyze-${Date.now()}`;
    imageEvents.emit('ImageAnalyzed', { id: requestId });
    const model = this.models?.selectModel({ task: 'image.analyze' as any });
    if (!model) return { id: requestId, metadata: { warning: 'no-model-selected' } };
    const runtimeModel = await this.runtime?.route({ capability: 'image.analyze', requestId, preferredModel: model?.id });
    return { id: requestId, metadata: { engine: this.id, model: runtimeModel?.id, analysis: 'stub' } };
  }
}

export default ImageEngine;
