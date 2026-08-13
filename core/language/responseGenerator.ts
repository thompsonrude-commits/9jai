import { LanguageResponse } from './types';

export class ResponseGenerator {
  formatText(text: string): LanguageResponse {
    return { text, format: 'text', confidence: 0.9 };
  }

  formatMarkdown(md: string): LanguageResponse {
    return { text: md, format: 'markdown', confidence: 0.9 };
  }

  formatJson(obj: any): LanguageResponse {
    return { text: JSON.stringify(obj, null, 2), format: 'json', confidence: 0.9 };
  }

  // simple streaming stub: yields chunks synchronously for tests
  *streamText(text: string, chunkSize = 64) {
    for (let i = 0; i < text.length; i += chunkSize) {
      yield text.slice(i, i + chunkSize);
    }
  }
}

export const defaultResponseGenerator = new ResponseGenerator();
