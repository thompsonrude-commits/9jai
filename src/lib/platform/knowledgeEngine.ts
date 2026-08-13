/**
 * Knowledge Engine — Semantic search and contextual knowledge retrieval
 * Lightweight client-side vector embeddings for Nigerian languages
 * Enables semantic matching without heavy ML dependencies
 */

import { db } from '../firebase';
import { collection, doc, setDoc, query, getDocs, where, orderBy, limit } from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface KnowledgeEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: 'vocab' | 'grammar' | 'cultural' | 'conversation' | 'document';
    language: string;
    category?: string;
    source?: string;
    confidence: number;
    timestamp: number;
  };
  userId?: string; // for personalized knowledge
}

export interface SemanticSearchResult {
  entry: KnowledgeEntry;
  similarity: number;
}

// ── Simple TF-IDF-based embeddings (lightweight, no external dependencies) ─

class SimpleEmbedder {
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private readonly embeddingDim = 64;

  // Tokenize text into normalized tokens
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  // Build vocabulary from corpus
  public buildVocabulary(documents: string[]): void {
    const tokenCounts = new Map<string, number>();
    const docCounts = new Map<string, number>();

    // Count token occurrences
    documents.forEach(doc => {
      const tokens = this.tokenize(doc);
      const uniqueTokens = new Set(tokens);
      
      tokens.forEach(token => {
        tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
      });

      uniqueTokens.forEach(token => {
        docCounts.set(token, (docCounts.get(token) || 0) + 1);
      });
    });

    // Build vocabulary from most common tokens
    const sortedTokens = Array.from(tokenCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.embeddingDim);

    sortedTokens.forEach(([token], idx) => {
      this.vocabulary.set(token, idx);
    });

    // Calculate IDF
    const totalDocs = documents.length;
    docCounts.forEach((count, token) => {
      this.idf.set(token, Math.log(totalDocs / count));
    });
  }

  // Generate embedding vector for text
  public embed(text: string): number[] {
    const tokens = this.tokenize(text);
    const tokenCounts = new Map<string, number>();

    // Count token frequencies
    tokens.forEach(token => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });

    // Build TF-IDF vector
    const vector = new Array(this.embeddingDim).fill(0);
    
    tokenCounts.forEach((count, token) => {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        const tf = count / tokens.length;
        const idf = this.idf.get(token) || 0;
        vector[idx] = tf * idf;
      }
    });

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(v => v / magnitude);
    }

    return vector;
  }

  // Compute cosine similarity between two vectors
  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    return magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 0;
  }
}

// ── Knowledge Engine ───────────────────────────────────────────────────────

class KnowledgeEngine {
  private embedder = new SimpleEmbedder();
  private localCache: KnowledgeEntry[] = [];
  private isInitialized = false;

  // Initialize with sample Nigerian language knowledge
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Sample corpus for building vocabulary
    const corpus = [
      'Hello how are you',
      'Good morning welcome',
      'Thank you very much',
      'What is your name',
      'I am learning Edo',
      'Koyọ ọ yẹse',
      'Ọbowiẹ obokhian',
      'Urhuese ọba',
      'E káàárọ̀ báwo ni',
      'Nnọọ kedu ka ị mere',
      'Sannu yaya lafiya',
      'How far wetin dey happen',
    ];

    this.embedder.buildVocabulary(corpus);
    
    // Load from localStorage cache
    try {
      const cached = localStorage.getItem('knowledge_cache');
      if (cached) {
        this.localCache = JSON.parse(cached);
      }
    } catch (err) {
      console.warn('[Knowledge] Failed to load cache:', err);
    }

    this.isInitialized = true;
  }

  // Add knowledge entry
  public async addEntry(
    content: string,
    metadata: KnowledgeEntry['metadata'],
    userId?: string
  ): Promise<KnowledgeEntry> {
    await this.initialize();

    const embedding = this.embedder.embed(content);
    const entry: KnowledgeEntry = {
      id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      embedding,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
      userId,
    };

    // Add to local cache
    this.localCache.push(entry);
    this.saveCache();

    // Save to Firestore (async, non-blocking)
    this.saveToFirestore(entry).catch(err => {
      console.warn('[Knowledge] Firestore save failed:', err);
    });

    return entry;
  }

  // Semantic search
  public async search(
    query: string,
    options: {
      type?: KnowledgeEntry['metadata']['type'];
      language?: string;
      userId?: string;
      topK?: number;
      minSimilarity?: number;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    await this.initialize();

    const queryEmbedding = this.embedder.embed(query);
    const topK = options.topK ?? 5;
    const minSimilarity = options.minSimilarity ?? 0.5;

    // Filter by metadata
    let candidates = this.localCache.filter(entry => {
      if (options.type && entry.metadata.type !== options.type) return false;
      if (options.language && entry.metadata.language !== options.language) return false;
      if (options.userId && entry.userId !== options.userId) return false;
      return true;
    });

    // Calculate similarities
    const results = candidates
      .map(entry => ({
        entry,
        similarity: this.embedder.cosineSimilarity(queryEmbedding, entry.embedding),
      }))
      .filter(r => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }

  // Find similar entries
  public async findSimilar(
    entry: KnowledgeEntry,
    topK: number = 5
  ): Promise<SemanticSearchResult[]> {
    await this.initialize();

    return this.localCache
      .filter(e => e.id !== entry.id)
      .map(e => ({
        entry: e,
        similarity: this.embedder.cosineSimilarity(entry.embedding, e.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // Get all entries by type
  public async getByType(
    type: KnowledgeEntry['metadata']['type'],
    language?: string
  ): Promise<KnowledgeEntry[]> {
    await this.initialize();

    return this.localCache.filter(
      entry =>
        entry.metadata.type === type &&
        (!language || entry.metadata.language === language)
    );
  }

  // Clear cache
  public clearCache(): void {
    this.localCache = [];
    this.saveCache();
  }

  // Get cache stats
  public getStats(): {
    totalEntries: number;
    byType: Record<string, number>;
    byLanguage: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};

    this.localCache.forEach(entry => {
      byType[entry.metadata.type] = (byType[entry.metadata.type] || 0) + 1;
      byLanguage[entry.metadata.language] = (byLanguage[entry.metadata.language] || 0) + 1;
    });

    return {
      totalEntries: this.localCache.length,
      byType,
      byLanguage,
    };
  }

  private saveCache(): void {
    try {
      // Keep only last 500 entries to prevent localStorage overflow
      const toSave = this.localCache.slice(-500);
      localStorage.setItem('knowledge_cache', JSON.stringify(toSave));
    } catch (err) {
      console.warn('[Knowledge] Failed to save cache:', err);
    }
  }

  private async saveToFirestore(entry: KnowledgeEntry): Promise<void> {
    try {
      const collectionName = entry.userId ? 'user_knowledge' : 'global_knowledge';
      const ref = doc(db, collectionName, entry.id);
      await setDoc(ref, entry);
    } catch (err) {
      console.warn('[Knowledge] Firestore save error:', err);
    }
  }

  // Load knowledge from Firestore
  public async loadFromFirestore(userId?: string): Promise<number> {
    try {
      const collectionName = userId ? 'user_knowledge' : 'global_knowledge';
      const q = userId
        ? query(collection(db, collectionName), where('userId', '==', userId), limit(200))
        : query(collection(db, collectionName), orderBy('metadata.timestamp', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      const entries: KnowledgeEntry[] = [];

      snapshot.forEach(doc => {
        entries.push(doc.data() as KnowledgeEntry);
      });

      // Merge with local cache (avoid duplicates)
      const existingIds = new Set(this.localCache.map(e => e.id));
      const newEntries = entries.filter(e => !existingIds.has(e.id));

      this.localCache = [...this.localCache, ...newEntries];
      this.saveCache();

      return newEntries.length;
    } catch (err) {
      console.warn('[Knowledge] Failed to load from Firestore:', err);
      return 0;
    }
  }
}

export const knowledgeEngine = new KnowledgeEngine();
