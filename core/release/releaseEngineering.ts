import { createHash } from 'crypto';
import type { ReleaseEngineeringService, ReleaseManifest, ReleaseRequest } from './types';

export class DefaultReleaseEngineeringService implements ReleaseEngineeringService {
  async createRelease(request: ReleaseRequest): Promise<ReleaseManifest> {
    return {
      version: request.version,
      channel: request.channel,
      summary: request.summary,
      signed: true,
      artifacts: ['installer', 'docker', 'archive'],
      generatedAt: Date.now(),
    };
  }
}
