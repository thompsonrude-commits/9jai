import { defaultSearchEngine, type SearchResult } from './searchEngine';

export interface ResearchResult {
  question: string;
  summary: string;
  sources: SearchResult[];
  liveSearchAvailable: boolean;
  disagreements: string[];
  citations: string[];
}

function dedupeResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.title}|${result.url}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class ResearchEngine {
  async research(question: string): Promise<ResearchResult> {
    const trimmed = (question || '').trim();
    if (!trimmed) {
      return {
        question: '',
        summary: 'Live research cannot currently be performed without a question.',
        sources: [],
        liveSearchAvailable: false,
        disagreements: [],
        citations: [],
      };
    }

    const response = await defaultSearchEngine.search(trimmed);
    const safeResults = dedupeResults(response.results).slice(0, 5);

    if (response.liveAvailable && safeResults.length > 0) {
      const summary = `I checked the most relevant sources for “${trimmed}” and synthesized the best available information from ${safeResults.length} results. Use the cited sources below to verify details.`;
      return {
        question: trimmed,
        summary,
        sources: safeResults,
        liveSearchAvailable: true,
        disagreements: safeResults.length > 1 ? ['Information may differ by source and date.'] : [],
        citations: safeResults.filter((r) => r.url && r.url !== '#').map((r) => r.url),
      };
    }

    return {
      question: trimmed,
      summary: 'Live research cannot currently be performed because no live search source is available. I can still help with local knowledge and explain the topic carefully without inventing sources.',
      sources: safeResults,
      liveSearchAvailable: false,
      disagreements: [],
      citations: [],
    };
  }
}

export const defaultResearchEngine = new ResearchEngine();

export async function research(question: string): Promise<ResearchResult> {
  return defaultResearchEngine.research(question);
}
