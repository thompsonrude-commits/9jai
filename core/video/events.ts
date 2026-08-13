import { EventEmitter } from 'events';

export const videoEvents = new EventEmitter();

export type VideoEventTypes =
  | 'VideoRequested'
  | 'VideoGenerated'
  | 'VideoEdited'
  | 'VideoAnalyzed'
  | 'VideoFailed'
  | 'PipelineStageStarted'
  | 'PipelineStageCompleted';
