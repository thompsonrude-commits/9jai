import type { TenantIsolationManager } from './types';

export class DefaultTenantIsolationManager implements TenantIsolationManager {
  isolate(input: { tenantId: string; subjectId: string }): boolean {
    return Boolean(input.tenantId && input.subjectId);
  }
}
