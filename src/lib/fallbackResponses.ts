export function getLocalFallbackResponse(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    return 'The AI service is temporarily unavailable. Please try again in a moment.';
  }

  return `The AI service is temporarily unavailable right now. I can still help with your request: ${normalized}`;
}
