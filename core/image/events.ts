import { EventEmitter } from 'events';

export const imageEvents = new EventEmitter();

export type ImageEventTypes =
  | 'ImageGenerated'
  | 'ImageEdited'
  | 'ImageAnalyzed'
  | 'ImageGenerationFailed'
  | 'ImageEditFailed'
  | 'ImageAnalysisFailed';
