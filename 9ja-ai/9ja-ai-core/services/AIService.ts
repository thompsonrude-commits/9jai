import { AIRequest, AIResponse } from '../types';
import { AIOrchestrator } from '../orchestrator/AIOrchestrator';

export class AIService {
  constructor(private readonly orchestrator: AIOrchestrator) {}

  public async process(request: AIRequest): Promise<AIResponse> {
    return this.orchestrator.handleRequest(request);
  }

  public async stream(request: AIRequest): Promise<AsyncIterable<AIResponse>> {
    return this.orchestrator.streamRequest(request);
  }
}
