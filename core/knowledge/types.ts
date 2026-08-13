export interface Document {
  id: string;
  title?: string;
  author?: string;
  date?: string | number;
  language?: string;
  source?: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface IndexRecord {
  id: string;
  docId: string;
  chunkId: string;
  text: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export interface RetrievalResult {
  id: string;
  docId: string;
  score: number;
  text: string;
  metadata?: Record<string, any>;
}
