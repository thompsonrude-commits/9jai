export class ReasoningManager {
  // placeholder for multi-step reasoning orchestration
  decomposeTask(prompt: string): string[] {
    // naive split by sentences for demo
    return prompt.split(/(?<=[.!?])\s+/).filter(Boolean);
  }

  evaluateSteps(steps: string[]): { step: string; note?: string }[] {
    return steps.map(s => ({ step: s }));
  }
}

export const defaultReasoningManager = new ReasoningManager();
