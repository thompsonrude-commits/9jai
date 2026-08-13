import { ConversationState, ConversationTurn } from './types';

const MAX_TURNS = 50;

export class ConversationManager {
  private states: Map<string, ConversationState> = new Map();

  getState(sessionId: string): ConversationState {
    if (!this.states.has(sessionId)) {
      this.states.set(sessionId, { sessionId, turns: [] });
    }
    return this.states.get(sessionId)!;
  }

  addTurn(sessionId: string, turn: ConversationTurn) {
    const state = this.getState(sessionId);
    state.turns.push({ ...turn, timestamp: Date.now() });
    if (state.turns.length > MAX_TURNS) {
      state.turns = state.turns.slice(-MAX_TURNS);
    }
  }

  summarize(sessionId: string): string | undefined {
    const state = this.states.get(sessionId);
    if (!state) return undefined;
    // lightweight summary: join last 5 turns
    const last = state.turns.slice(-5).map(t => `${t.role}: ${t.content}`).join('\n');
    state.summary = last;
    return state.summary;
  }

  clear(sessionId: string) {
    this.states.delete(sessionId);
  }
}

export const defaultConversationManager = new ConversationManager();
