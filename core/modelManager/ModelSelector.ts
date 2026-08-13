import type { ModelDescriptor, ModelSelectionCriteria } from './types';
import { ResourceMonitor } from './ResourceMonitor';

export class ModelSelector {
  private readonly resourceMonitor = new ResourceMonitor();

  select(models: ModelDescriptor[], criteria: ModelSelectionCriteria): ModelDescriptor | undefined {
    const filtered = models.filter((model) => this.matchesCriteria(model, criteria));
    if (filtered.length === 0) return undefined;

    const sorted = filtered.sort((a, b) => {
      const scoreA = this.scoreModel(a, criteria);
      const scoreB = this.scoreModel(b, criteria);
      return scoreB - scoreA;
    });

    return sorted[0];
  }

  private matchesCriteria(model: ModelDescriptor, criteria: ModelSelectionCriteria): boolean {
    if (!model.supportedTasks.includes(criteria.task)) return false;
    if (criteria.category && model.category !== criteria.category) return false;
    if (criteria.preferredProvider && model.provider !== criteria.preferredProvider) return false;
    if (criteria.supportedLanguage && model.supportedLanguages && !model.supportedLanguages.includes(criteria.supportedLanguage)) return false;
    if (criteria.requiredGpu && !model.requiredHardware?.gpuRequired) return false;
    if (!criteria.allowDeprecated && model.status === 'deprecated') return false;
    return true;
  }

  private scoreModel(model: ModelDescriptor, criteria: ModelSelectionCriteria): number {
    let score = 0;

    if (criteria.preferredProvider && model.provider === criteria.preferredProvider) score += 20;
    if (model.status === 'ready') score += 15;
    if (model.status === 'validated') score += 10;
    if (model.status === 'deprecated') score -= 50;
    if (model.health?.status === 'healthy') score += 20;
    if (model.health?.status === 'degraded') score += 5;
    if (criteria.supportedLanguage && model.supportedLanguages?.includes(criteria.supportedLanguage)) score += 10;
    if (criteria.userPreferences?.providerOrder) {
      const index = criteria.userPreferences.providerOrder.indexOf(model.provider);
      if (index >= 0) score += 15 - index;
    }
    if (criteria.userPreferences?.preferLocalModels && model.source === 'local') score += 10;
    if (criteria.maxMemoryMb && model.requiredHardware?.minRamMb) {
      score -= Math.max(0, model.requiredHardware.minRamMb - criteria.maxMemoryMb) * 0.1;
    }

    return score;
  }
}
