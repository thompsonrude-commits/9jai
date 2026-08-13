import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

export interface ConnectorPackageManifest {
  id: string;
  version: string;
  entrypoint: string;
  dependencies?: string[];
}

export class ConnectorPackageLoader {
  loadPackage(rootDir: string): ConnectorPackageManifest {
    const manifestPath = path.join(rootDir, 'connector.json');
    if (!existsSync(manifestPath)) {
      throw new Error(`Connector package manifest not found at ${manifestPath}`);
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ConnectorPackageManifest;
    if (!manifest.id || !manifest.entrypoint) {
      throw new Error('Connector package manifest is invalid');
    }
    return manifest;
  }
}
