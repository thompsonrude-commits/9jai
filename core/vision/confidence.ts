export class ConfidenceManager {
  overall(scores: number[]) {
    if (!scores.length) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.max(0, Math.min(1, avg));
  }
}

export const defaultConfidenceManager = new ConfidenceManager();
