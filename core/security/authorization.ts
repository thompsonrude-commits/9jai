import type { AuthorizationService, SecuritySubject } from './types';

export class DefaultAuthorizationService implements AuthorizationService {
  constructor(private readonly identities: { getUser(id: string): Promise<{ roles?: string[]; tenantId: string } | undefined> }) {}

  async authorize(subject: SecuritySubject, action: string, context: Record<string, unknown> = {}): Promise<boolean> {
    const resourceTenantId = context.resourceTenantId as string | undefined;
    if (resourceTenantId && subject.tenantId !== resourceTenantId) {
      return false;
    }

    const roles = subject.roles ?? [];
    if (roles.includes('admin')) return true;
    if (action === 'model:read' && roles.includes('viewer')) return true;
    if (action === 'model:delete' && roles.includes('admin')) return true;
    if (action === 'workflow.run' && roles.includes('agent')) return true;
    if (action === 'plugin.install' && roles.includes('admin')) return true;
    return false;
  }
}
