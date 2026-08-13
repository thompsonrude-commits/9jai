import { DetectedObject } from './types';

export class RelationshipAnalyzer {
  analyze(objects: DetectedObject[]) {
    // produce simple nearest-neighbor relations
    const relations: Array<{ from: string; to: string; relation: string }> = [];
    if (objects.length >= 2) {
      relations.push({ from: objects[0].id || 'o1', to: objects[1].id || 'o2', relation: 'near' });
    }
    return relations;
  }
}

export const defaultRelationshipAnalyzer = new RelationshipAnalyzer();
