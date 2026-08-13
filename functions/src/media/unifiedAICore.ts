export const unifiedAICore = {
  async planRequest(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      providers: (input.preferredProviders as string[] | undefined) ?? [],
      expertPlan: undefined,
    };
  },
  getTelemetry(): Record<string, unknown> {
    return {};
  },
};
