export const reasoningExplanationEngine = {
  createReasoningReport(_input: Record<string, unknown>): string {
    return 'reasoning-report';
  },
  recordProviderSelection(_requestId: string, _provider: string, _reason: string): void {
    return;
  },
  recordModelSelection(_requestId: string, _model: string, _reason: string): void {
    return;
  },
  recordQualityExplanation(_requestId: string, _score: number, _strengths: string[], _risks: string[], _recommendation: string): void {
    return;
  },
  recordSelfCritique(_requestId: string, _score: number, _strengths: string[], _risks: string[], _recommendation: string): void {
    return;
  },
  recordFailureExplanation(_requestId: string, _error: string, _recommendation: string): void {
    return;
  },
  getHistory(): unknown[] {
    return [];
  },
  getTelemetry(): Record<string, unknown> {
    return {};
  },
  getExplanation(_requestId: string): Record<string, unknown> {
    return { requestId: _requestId };
  },
};
