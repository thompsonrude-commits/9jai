/**
 * DuckDuckGo Search Provider — FREE, NO API KEY REQUIRED
 * 
 * Uses DuckDuckGo HTML search (no official API, but free)
 * Alternative to Tavily for current information retrieval
 * 
 * FREE-FIRST COMPLIANCE: ✅ YES
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Search DuckDuckGo and return results
 */
export async function duckduckgoSearch(
  query: string,
  maxResults = 10
): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse HTML results
    const results: SearchResult[] = [];
    
    // Extract results using regex patterns
    // DuckDuckGo HTML structure: <div class="result">...</div>
    const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;
    
    let match;
    while ((match = resultPattern.exec(html)) && results.length < maxResults) {
      const url = decodeURIComponent(match[1]);
      const title = match[2]
        .replace(/<b>/g, '')
        .replace(/<\/b>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();
      const snippet = match[3]
        .replace(/<b>/g, '')
        .replace(/<\/b>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();
      
      // Filter out DuckDuckGo internal links
      if (!url.includes('duckduckgo.com') && url.startsWith('http')) {
        results.push({ url, title, snippet });
      }
    }
    
    return results;
  } catch (err: any) {
    console.error('[DuckDuckGo] Search failed:', err.message);
    throw new Error(`DuckDuckGo search error: ${err.message}`);
  }
}

/**
 * Build search context string for AI
 */
export function buildSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return '';
  
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
    .join('\n\n');
}

export async function googleNewsSearch(query: string, maxResults = 10): Promise<SearchResult[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-NG&gl=NG&ceid=NG:en`;
  const response = await fetch(url, {
    headers: { 'User-Agent': '9JAI/1.0 (+https://9jai.web.app)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Google News RSS failed: ${response.status}`);
  const xml = await response.text();
  const results: SearchResult[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let item: RegExpExecArray | null;
  while ((item = itemPattern.exec(xml)) && results.length < maxResults) {
    const block = item[1];
    const read = (tag: string) => {
      const match = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return (match?.[1] ?? match?.[2] ?? '').replace(/<[^>]+>/g, '').trim();
    };
    const title = read('title');
    const link = read('link');
    const description = read('description');
    if (title && link) results.push({ title, url: link, snippet: description });
  }
  if (results.length === 0) throw new Error('Google News RSS returned no results');
  return results;
}

/**
 * Search with automatic retry
 */
export async function duckduckgoSearchWithRetry(
  query: string,
  maxResults = 10,
  maxRetries = 2
): Promise<SearchResult[]> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await duckduckgoSearch(query, maxResults);
    } catch (err: any) {
      if (attempt === maxRetries) {
        throw err;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return [];
}
