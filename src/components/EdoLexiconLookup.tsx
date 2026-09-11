import React, { useState } from 'react';
import { lookupWord, searchEnglish } from '../lib/edoLexiconClient';

export default function EdoLexiconLookup() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    setError('');
    setResults([]);
    setResult(null);
    if (!query.trim()) return setError('Enter a word or English meaning');
    setLoading(true);
    try {
      const byWord = await lookupWord(query.trim());
      if (byWord) {
        setResult(byWord);
      } else {
        const search = await searchEnglish(query.trim());
        setResults(search);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-2">Edo Lexicon Lookup</h3>
      <div className="flex gap-2 mb-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter Edo word or English meaning" className="flex-1 p-2 border rounded" />
        <button onClick={handleLookup} className="px-3 py-2 bg-[#008751] text-white rounded">Lookup</button>
      </div>
      {loading && <div>Looking up…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {result && (
        <div className="border rounded p-3 bg-gray-50">
          <div><strong>Word:</strong> {result.word}</div>
          <div><strong>English:</strong> {result.englishMeaning}</div>
          <div><strong>Edo:</strong> {result.edoMeaning}</div>
          <div><strong>Category:</strong> {result.grammaticalCategory}</div>
          <div><strong>Examples:</strong> {Array.isArray(result.examples) ? result.examples.join(' | ') : result.examples}</div>
          <div><strong>Source:</strong> {result.source}</div>
          <div><strong>Confidence:</strong> {result.confidence}</div>
          <div><strong>Approval:</strong> {result.trainerApproval}</div>
        </div>
      )}
      {results && results.length > 0 && (
        <div className="grid gap-2">
          {results.map(r => (
            <div key={r.id} className="border rounded p-3 bg-gray-50">
              <div><strong>{r.word}</strong> — {r.englishMeaning}</div>
              <div className="text-xs text-gray-600">{r.source} — {r.trainerApproval} — confidence {r.confidence}</div>
            </div>
          ))}
        </div>
      )}
      {!result && (!results || results.length === 0) && !loading && <div className="text-sm text-gray-500 mt-2">No results</div>}
    </div>
  );
}
