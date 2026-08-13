import type { PackageSource } from './types';

export class PackageRegistry {
  private readonly sources = new Map<string, PackageSource>();

  registerSource(source: PackageSource): void {
    if (this.sources.has(source.id)) {
      throw new Error(`Package source ${source.id} already registered`);
    }
    this.sources.set(source.id, source);
  }

  unregisterSource(sourceId: string): void {
    this.sources.delete(sourceId);
  }

  listSources(): PackageSource[] {
    return Array.from(this.sources.values());
  }

  getSource(sourceId: string): PackageSource | undefined {
    return this.sources.get(sourceId);
  }

  resolvePackage(packageName: string): PackageSource | undefined {
    return this.listSources().find((source) => packageName.startsWith(source.id) || packageName.includes(source.id));
  }
}
