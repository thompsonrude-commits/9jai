import { LanguageRequest, LanguageResponse } from './types';

export interface MemoryAdapter {
  retrieveRelevant(request: LanguageRequest, limit?: number): Promise<string[]>;
}

export interface KnowledgeAdapter {
  retrieve(query: string, limit?: number): Promise<Array<{ text: string; source?: string; score?: number }>>;
}

export interface ToolInvoker {
  invoke(tool: string, payload: any): Promise<any>;
}

export interface LanguageEngineAdapters {
  memory?: MemoryAdapter;
  knowledge?: KnowledgeAdapter;
  tools?: ToolInvoker;
}

export const noopMemoryAdapter: MemoryAdapter = {
  async retrieveRelevant() { return []; }
};

export const noopKnowledgeAdapter: KnowledgeAdapter = {
  async retrieve() { return []; }
};

export const noopToolInvoker: ToolInvoker = {
  async invoke() { return { ok: false, reason: 'noop' }; }
};
