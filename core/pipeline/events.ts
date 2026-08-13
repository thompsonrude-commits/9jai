import { EventEmitter } from 'events';

export const pipelineEvents = new EventEmitter();

export type PipelineEventTypes = 'PlanCreated' | 'StepStarted' | 'StepCompleted' | 'PipelineCompleted' | 'PipelineFailed';
