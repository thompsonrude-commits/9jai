import { AIRequest, EngineKind } from '../types';

export class InferenceRouter {
  public route(request: AIRequest): EngineKind {
    // TODO: map incoming requests to the correct engine based on operation and payload.
    switch (request.kind) {
      case 'language':
        return 'language';
      case 'vision':
        return 'vision';
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'speech':
        return 'speech';
      case 'translation':
        return 'translation';
      case 'memory':
        return 'memory';
      case 'ocr':
        return 'ocr';
      default:
        throw new Error('TODO: implement route selection for unsupported request kinds');
    }
  }
}
