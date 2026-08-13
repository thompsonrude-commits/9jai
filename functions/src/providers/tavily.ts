/**
 * Tavily web search provider — realtime internet knowledge
 * https://docs.tavily.com
 */

import { defineSecret } from 'firebase-functions/params';
import { getSecretValue } from './secretHelpers';

export const TAVILY_KEY = defineSecret('TAVILY_KEY');

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  answer?: string;
  query: string;
}

// ── Web search ─────────────────────────────────────────────────────────────

export async function tavilySearch(
  query: string,
  maxResults = 6,
  searchDepth: 'basic' | 'advanced' = 'advanced'
): Promise<SearchResponse> {
  const key = getSecretValue('TAVILY_KEY', TAVILY_KEY);
  if (!key) throw new Error('TAVILY_KEY secret not configured');

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: true,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tavily ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as any;

  return {
    query,
    answer: data.answer,
    results: (data.results ?? []).map((r: any) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
      score: r.score ?? 0,
    })),
  };
}

// ── URL content extraction ─────────────────────────────────────────────────

export async function tavilyExtract(url: string): Promise<string> {
  const key = getSecretValue('TAVILY_KEY', TAVILY_KEY);
  if (!key) throw new Error('TAVILY_KEY secret not configured');

  const res = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, urls: [url] }),
  });

  if (!res.ok) return '';

  const data = await res.json() as any;
  const content = data.results?.[0]?.raw_content ?? data.results?.[0]?.content ?? '';
  return content.slice(0, 8000);
}

// ── Build search context string for AI ────────────────────────────────────

export function buildSearchContext(response: SearchResponse): string {
  if (response.results.length === 0) return '';

  const parts: string[] = [];

  if (response.answer) {
    parts.push(`**Quick Answer:** ${response.answer}`);
  }

  const sources = response.results
    .slice(0, 5)
    .map((r, i) => `[${i + 1}] **${r.title}**\n${r.content.slice(0, 400)}...\nSource: ${r.url}`)
    .join('\n\n');

  parts.push(`**Web Search Results:**\n${sources}`);

  return parts.join('\n\n');
}
