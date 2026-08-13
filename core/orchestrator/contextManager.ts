import type { OrchestratorRequest } from './types';

export class ContextManager {
  private sessions = new Map<string, any>();

  getSession(sessionId: string) {
    if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, { history: [] });
    return this.sessions.get(sessionId);
  }

  addToSession(sessionId: string, entry: any) {
    const s = this.getSession(sessionId);
    s.history.push(entry);
  }
}
