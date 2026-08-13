import * as fs from 'fs/promises';
import * as path from 'path';
import type { ModelDescriptor, ModelDiscoveryOptions, ModelValidationResult } from './types';
import { ModelValidator } from './ModelValidator';
import { modelEvents } from './events';

const DEFAULT_MANIFESTS = ['model.json', 'metadata.json', 'descriptor.json'];

export class ModelDiscovery {
  constructor(private readonly validator: ModelValidator) {}

  async discover(options: ModelDiscoveryOptions): Promise<{ discovered: ModelDescriptor[]; invalid: Array<{ path: string; errors: string[] }> }> {
    const manifests = options.manifestFileNames ?? DEFAULT_MANIFESTS;
    const discovered: ModelDescriptor[] = [];
    const invalid: Array<{ path: string; errors: string[] }> = [];

    for (const basePath of options.searchPaths) {
      const paths = await this.findManifestFiles(basePath, manifests, !!options.recursive);
      for (const manifestPath of paths) {
        try {
          const descriptor = await this.loadManifest(manifestPath);
          const validation = await this.validator.validate(descriptor);
          if (validation.valid) {
            discovered.push(descriptor);
            modelEvents.emitEvent({ type: 'ModelDiscovered', model: descriptor });
          } else {
            invalid.push({ path: manifestPath, errors: validation.errors });
          }
        } catch (error) {
          invalid.push({ path: manifestPath, errors: [String(error)] });
        }
      }
    }

    return { discovered, invalid };
  }

  private async findManifestFiles(dir: string, manifests: string[], recursive: boolean): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        results.push(...(await this.findManifestFiles(entryPath, manifests, recursive)));
      }
      if (entry.isFile() && manifests.includes(entry.name)) {
        results.push(entryPath);
      }
    }

    return results;
  }

  private async loadManifest(manifestPath: string): Promise<ModelDescriptor> {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as ModelDescriptor;
    return {
      ...parsed,
      filePath: parsed.filePath || path.resolve(path.dirname(manifestPath), parsed.filePath ?? ''),
      status: 'discovered',
      installedAt: parsed.installedAt ?? new Date().toISOString(),
    };
  }
}
