export class CancellationManager {
  private tokens = new Map<string, { cancelled: boolean }>();

  createToken(jobId: string) {
    const t = { cancelled: false };
    this.tokens.set(jobId, t);
    return t;
  }

  cancel(jobId: string) {
    const t = this.tokens.get(jobId);
    if (t) t.cancelled = true;
  }

  isCancelled(jobId: string) {
    const t = this.tokens.get(jobId);
    return !!t && t.cancelled;
  }

  clear(jobId: string) {
    this.tokens.delete(jobId);
  }
}
