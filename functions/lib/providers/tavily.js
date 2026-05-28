"use strict";
/**
 * Tavily web search provider — realtime internet knowledge
 * https://docs.tavily.com
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAVILY_KEY = void 0;
exports.tavilySearch = tavilySearch;
exports.tavilyExtract = tavilyExtract;
exports.buildSearchContext = buildSearchContext;
const params_1 = require("firebase-functions/params");
exports.TAVILY_KEY = (0, params_1.defineSecret)('TAVILY_KEY');
// ── Web search ─────────────────────────────────────────────────────────────
async function tavilySearch(query, maxResults = 6, searchDepth = 'advanced') {
    const key = exports.TAVILY_KEY.value();
    if (!key)
        throw new Error('TAVILY_KEY secret not configured');
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
    const data = await res.json();
    return {
        query,
        answer: data.answer,
        results: (data.results ?? []).map((r) => ({
            title: r.title ?? '',
            url: r.url ?? '',
            content: r.content ?? '',
            score: r.score ?? 0,
        })),
    };
}
// ── URL content extraction ─────────────────────────────────────────────────
async function tavilyExtract(url) {
    const key = exports.TAVILY_KEY.value();
    if (!key)
        throw new Error('TAVILY_KEY secret not configured');
    const res = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, urls: [url] }),
    });
    if (!res.ok)
        return '';
    const data = await res.json();
    const content = data.results?.[0]?.raw_content ?? data.results?.[0]?.content ?? '';
    return content.slice(0, 8000);
}
// ── Build search context string for AI ────────────────────────────────────
function buildSearchContext(response) {
    if (response.results.length === 0)
        return '';
    const parts = [];
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
//# sourceMappingURL=tavily.js.map