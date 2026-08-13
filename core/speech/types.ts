export type SpeechInputType = 'audio' | 'text' | 'stream';

export interface SttRequest {
  id?: string;
  inputType: 'audio' | 'stream';
  data: any; // buffer, path, stream token
  options?: Record<string, any>;
}

export interface TtsRequest {
  id?: string;
  inputType: 'text' | 'stream';
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  options?: Record<string, any>;
}

export interface SttResult {
  id?: string;
  transcript: string;
  language?: string;
  confidence: number;
  segments?: Array<{ start: number; end: number; text: string; confidence: number }>;
  metadata?: Record<string, any>;
}

export interface TtsResult {
  id?: string;
  audio: any; // placeholder for audio buffer or stream handle
  mimeType?: string;
  metadata?: Record<string, any>;
}

export interface SpeechEngineOptions {
  id?: string;
  name?: string;
}

export interface SpeechResult {
  stt?: SttResult;
  tts?: TtsResult;
}
