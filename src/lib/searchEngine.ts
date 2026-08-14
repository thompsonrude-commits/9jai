export interface SearchResult {
  title: string;
  url: string;
  source: 'live' | 'local' | 'cached';
  snippet: string;
  date?: string;
}

export interface SearchResponse {
  query: string;
  source: 'live' | 'local' | 'cached';
  results: SearchResult[];
  liveAvailable: boolean;
  note?: string;
}

const LOCAL_KNOWLEDGE: Array<{ keywords: string[]; title: string; snippet: string; url: string }> = [
  { keywords: ['weather', 'rain', 'sun', 'storm', 'temperature'], title: 'Weather basics', snippet: 'Local weather guidance requires a live source or user location. Use browser geolocation when permission is granted.', url: '#local-weather' },
  { keywords: ['time', 'clock', 'timezone', 'date'], title: 'Time and timezone', snippet: 'Current time should come from the device/browser clock and Intl.DateTimeFormat().resolvedOptions().timeZone.', url: '#local-time' },
  { keywords: ['language', 'yoruba', 'igbo', 'hausa', 'edo', 'esan', 'pidgin'], title: 'African languages', snippet: '9JAI supports Nigerian Pidgin, Yoruba, Igbo, Hausa, Edo, and Esan as conversation languages.', url: '#local-languages' },
  { keywords: ['vision', 'image', 'camera', 'ocr', 'photo'], title: 'Vision and OCR', snippet: 'Local vision and OCR use browser capabilities first, then optional configured local integrations.', url: '#local-vision' },
  { keywords: ['education', 'science', 'math', 'health', 'history'], title: 'General knowledge', snippet: 'Use verified local knowledge and clearly label anything that comes from a live external source.', url: '#local-knowledge' },
];

function normalizeQuery(query: string): string {
  return (query || '').trim().toLowerCase();
}

function localKnowledgeMatches(query: string): SearchResult[] {
  const q = normalizeQuery(query);
  if (!q) return [];
  return LOCAL_KNOWLEDGE.filter((entry) =>
    entry.keywords.some((keyword) => q.includes(keyword)) || entry.title.toLowerCase().includes(q)
  ).map((entry) => ({
    title: entry.title,
    url: entry.url,
    source: 'local' as const,
    snippet: entry.snippet,
  }));
}

async function fetchLiveSearch(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return [];
    const data = await response.json();
    const items: SearchResult[] = [];
    const topics = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : [];
    for (const item of topics) {
      if (!item) continue;
      const text = typeof item === 'string' ? item : item.Text;
      const href = typeof item === 'string' ? '' : item.FirstURL;
      if (text) {
        items.push({ title: text.slice(0, 64), url: href || '#', source: 'live', snippet: text.slice(0, 200), date: undefined });
      }
    }
    if (items.length === 0 && data?.AbstractText) {
      items.push({ title: data.Heading || query, url: data.AbstractURL || '#', source: 'live', snippet: data.AbstractText.slice(0, 220) });
    }
    return items.slice(0, 5);
  } catch {
    return [];
  }
}

export class SearchEngine {
  async search(query: string): Promise<SearchResponse> {
    const normalized = (query || '').trim();
    const liveResults = await fetchLiveSearch(normalized);
    if (liveResults.length > 0) {
      return {
        query: normalized,
        source: 'live',
        results: liveResults,
        liveAvailable: true,
      };
    }

    const localResults = localKnowledgeMatches(normalized);
    if (localResults.length > 0) {
      return {
        query: normalized,
        source: 'local',
        results: localResults,
        liveAvailable: false,
        note: 'Live search is currently unavailable. Showing locally available knowledge and cached context only.',
      };
    }

    return {
      query: normalized,
      source: 'cached',
      results: [{
        title: 'No live web result found',
        url: '#',
        source: 'cached',
        snippet: 'Live search is currently unavailable. I can still help with local knowledge, analysis, and explanation using the in-house engine.',
      }],
      liveAvailable: false,
      note: 'Live search is currently unavailable.',
    };
  }
}

export const defaultSearchEngine = new SearchEngine();

export async function search(query: string): Promise<SearchResponse> {
  return defaultSearchEngine.search(query);
}
