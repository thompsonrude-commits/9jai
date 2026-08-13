import { ImageInput, ImageAnalysisResult } from './types';
import { defaultImageAnalyzer } from './imageAnalyzer';
import { defaultObjectDetector } from './objectDetector';
import { defaultSceneAnalyzer } from './sceneAnalyzer';
import { defaultRelationshipAnalyzer } from './relationshipAnalyzer';
import { defaultImageClassifier } from './classifier';
import { defaultImageComparator } from './comparator';
import { defaultVisualQuestion } from './visualQuestion';
import { defaultConfidenceManager } from './confidence';
import { defaultMetadataGenerator } from './metadata';

export class VisionEngine {
  async analyzeImage(image: ImageInput): Promise<ImageAnalysisResult> {
    const analysis = await defaultImageAnalyzer.analyze(image);
    // enrich with relations
    const relations = defaultRelationshipAnalyzer.analyze(analysis.objects as any);
    (analysis.objects || []).forEach((o: any) => { o.relations = relations.map(r => ({ toId: r.to, relation: r.relation })); });
    // overall confidence
    analysis.confidence = defaultConfidenceManager.overall(analysis.objects.map((o: any) => o.confidence));
    analysis.metadata = { ...analysis.metadata, ...defaultMetadataGenerator.generate(image) };
    return analysis;
  }

  async detectObjects(image: ImageInput) {
    return defaultObjectDetector.detect(image);
  }

  async classifyImage(image: ImageInput, categories?: string[]) {
    return defaultImageClassifier.classify(image, categories);
  }

  async compareImages(images: ImageInput[]) {
    return defaultImageComparator.compare(images);
  }

  async answerVisualQuestion(question: string, image: ImageInput, analysis?: ImageAnalysisResult) {
    return defaultVisualQuestion.ask(question, image, analysis);
  }
}

export const defaultVisionEngine = new VisionEngine();
