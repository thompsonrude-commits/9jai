export interface LanguageProfile {
  id: string;
  name: string;
  location: string;
  history?: string;
  culture?: string;
  alphabet?: string[];
  lastSearchReport?: string;
  sources?: any[];
  createdAt: any;
}

export interface LinguisticMaterial {
  id: string;
  languageId: string;
  type: 'dictionary' | 'grammar' | 'sentence' | 'name' | 'pronunciation';
  title: string;
  content: string;
  translation?: string;
  transcription?: string;
  sourceUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
