import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryIdentityStore,
  DefaultAuthenticationService,
  DefaultAuthorizationService,
  DefaultPolicyEngine,
  InMemorySecretStore,
  DefaultEncryptionEngine,
  DefaultAuditEngine,
  DefaultTrustLedger,
  DefaultTenantIsolationManager,
  DefaultSecuritySandbox,
  type SecuritySubject,
} from './index.js';

test('identity and auth service enforce access and sessions', async () => {
  const identities = new InMemoryIdentityStore();
  await identities.createUser({ id: 'user-1', tenantId: 'tenant-a', roles: ['viewer'] });
  const auth = new DefaultAuthenticationService(identities);
  const session = await auth.createSession({ id: 'user-1', tenantId: 'tenant-a' });
  assert.equal(session.valid, true);
  const principal = await auth.authenticate({ id: 'user-1', tenantId: 'tenant-a' });
  assert.equal(principal?.id, 'user-1');
});

test('authorization service supports RBAC and ABAC decisions', async () => {
  const identities = new InMemoryIdentityStore();
  await identities.createUser({ id: 'admin-1', tenantId: 'tenant-a', roles: ['admin'], attributes: { region: 'eu' } });
  const authz = new DefaultAuthorizationService(identities);
  const subject: SecuritySubject = { id: 'admin-1', tenantId: 'tenant-a', roles: ['admin'], attributes: { region: 'eu' } };
  assert.equal(await authz.authorize(subject, 'model:read', { resourceTenantId: 'tenant-a' }), true);
  assert.equal(await authz.authorize(subject, 'model:delete', { resourceTenantId: 'tenant-a' }), true);
  assert.equal(await authz.authorize({ id: 'viewer', tenantId: 'tenant-a', roles: ['viewer'] }, 'model:delete', { resourceTenantId: 'tenant-a' }), false);
});

test('policy engine evaluates versioned policies', async () => {
  const policyEngine = new DefaultPolicyEngine();
  const decision = await policyEngine.evaluate({
    subject: { id: 'agent-1', tenantId: 'tenant-a', roles: ['agent'] },
    action: 'workflow.run',
    resource: 'workflow:demo',
    context: { tenantId: 'tenant-a' },
  });
  assert.equal(decision.allowed, true);
  assert.equal(decision.policyVersion, '1.0.0');
});

test('secrets and encryption round-trip safely', async () => {
  const secrets = new InMemorySecretStore();
  await secrets.storeSecret('tenant-a', 'connector-key', 'super-secret');
  const encryption = new DefaultEncryptionEngine();
  const cipher = await encryption.encrypt('tenant-a', 'super-secret');
  const plain = await encryption.decrypt('tenant-a', cipher);
  assert.equal(plain, 'super-secret');
});

test('audit, trust, tenant isolation, and sandboxing operate end to end', async () => {
  const audit = new DefaultAuditEngine();
  const trust = new DefaultTrustLedger();
  const tenantManager = new DefaultTenantIsolationManager();
  const sandbox = new DefaultSecuritySandbox();

  await audit.record({ type: 'auth', subjectId: 'user-1', outcome: 'allow' });
  await trust.record({ action: 'workflow.run', subjectId: 'user-1', outcome: 'allow' });
  const isolated = tenantManager.isolate({ tenantId: 'tenant-a', subjectId: 'user-1' });
  assert.equal(isolated, true);
  const sandboxResult = await sandbox.execute({ action: 'plugin.install', resource: 'plugin:test' });
  assert.equal(sandboxResult.allowed, true);
});
