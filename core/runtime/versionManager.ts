import { ModelRegistry } from './modelRegistry';

export class VersionManager {
  private readonly history = new Map<string, string[]>();

  constructor(private registry: ModelRegistry) {}

  listVersions(modelId: string): string[] {
    const m = this.registry.get(modelId);
    if (!m) return [];
    return [...(this.history.get(modelId) ?? []), m.version].filter(Boolean);
  }

  async rollback(modelId: string, version: string): Promise<void> {
    const m = this.registry.get(modelId);
    if (!m) throw new Error('Model not found');
    const versions = this.history.get(modelId) ?? [];
    this.history.set(modelId, [...versions, m.version]);
    this.registry.update(modelId, { ...m, version });
  }
}
