import type { SecuritySandbox } from './types';

export class DefaultSecuritySandbox implements SecuritySandbox {
  async execute(input: { action: string; resource: string }): Promise<{ allowed: boolean; reason: string }> {
    if (input.action === 'plugin.install' && input.resource.startsWith('plugin:')) {
      return { allowed: true, reason: 'sandbox approved' };
    }
    return { allowed: false, reason: 'sandbox denied' };
  }
}
