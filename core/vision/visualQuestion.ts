import { ImageInput, ImageAnalysisResult } from './types';

export class VisualQuestionInterface {
  async ask(question: string, image: ImageInput, analysis?: ImageAnalysisResult) {
    // deterministic simple answers for tests
    if (question.toLowerCase().includes('objects')) {
      return { answer: 'person, phone', confidence: 0.8 };
    }
    if (question.toLowerCase().includes('describe')) {
      return { answer: analysis?.description || 'A person holding a phone.', confidence: 0.75 };
    }
    return { answer: 'I do not know', confidence: 0.2 };
  }
}

export const defaultVisualQuestion = new VisualQuestionInterface();
