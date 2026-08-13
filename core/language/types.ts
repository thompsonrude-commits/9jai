export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ConversationState {
  sessionId: string;
  turns: ConversationTurn[];
  summary?: string;
}

export interface LanguageRequest {
  sessionId?: string;
  userId?: string;
  input: string;
  options?: Record<string, any>;
}

export interface LanguageResponse {
  text: string;
  format?: 'text' | 'markdown' | 'json';
  confidence?: number;
  citations?: Array<{ source: string; score: number }>;
}
