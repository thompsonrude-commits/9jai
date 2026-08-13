// Simple, deterministic text -> vector embedding for offline testing.
export async function simpleEmbed(text: string): Promise<number[]> {
  const vec: number[] = new Array(64).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    vec[i % vec.length] = (vec[i % vec.length] + c) % 1000;
  }
  // normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}

export class SemanticIndex {
  private records: { id: string; vector: number[]; rec: any }[] = [];

  add(recId: string, vector: number[], rec: any) {
    this.records.push({ id: recId, vector, rec });
  }

  search(vector: number[], topK = 5) {
    const scored = this.records.map((r) => ({ r, score: cosine(vector, r.vector) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => ({ id: s.r.id, score: s.score, rec: s.r.rec }));
  }
}
