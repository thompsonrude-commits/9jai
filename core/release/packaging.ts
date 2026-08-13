import { createHash } from 'crypto';
import type { PackagingService, PackageArtifact } from './types';

export class DefaultPackagingService implements PackagingService {
  async buildArtifact(input: { name: string; version: string }): Promise<PackageArtifact> {
    const checksum = createHash('sha256').update(`${input.name}:${input.version}`).digest('hex');
    return {
      name: input.name,
      version: input.version,
      checksum,
      signed: true,
      format: 'tar.gz',
      createdAt: Date.now(),
    };
  }
}
