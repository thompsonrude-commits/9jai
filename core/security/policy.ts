import type { PolicyDecision, PolicyEngine, PolicyEvaluationRequest } from './types';

export class DefaultPolicyEngine implements PolicyEngine {
  async evaluate(request: PolicyEvaluationRequest): Promise<PolicyDecision> {
    const roles = request.subject.roles ?? [];
    const allowed = roles.includes('agent') || roles.includes('admin') || request.context?.tenantId === request.subject.tenantId;
    return {
      allowed,
      policyVersion: '1.0.0',
      reason: allowed ? 'default policy allow' : 'default policy deny',
      explanation: `Policy evaluated for ${request.action} on ${request.resource}`,
    };
  }
}
