import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryCredentialVault,
  InMemoryConnectorRegistry,
  ConnectorSDK,
  DefaultAuthenticationManager,
  DefaultWebhookEngine,
  DefaultRetryManager,
  DefaultCircuitBreakerManager,
  DefaultHealthMonitoringEngine,
  ConnectorLifecycleState,
  type ConnectorDefinition,
  type ConnectorManifest,
} from './index.js';

test('registers and discovers connector capabilities', async () => {
  const registry = new InMemoryConnectorRegistry();
  const manifest: ConnectorManifest = {
    id: 'demo-storage',
    name: 'Demo Storage',
    version: '1.0.0',
    description: 'Demo connector',
    category: 'storage',
    capabilities: [{ id: 'upload', kind: 'action', description: 'Upload a file' }],
    permissions: ['storage:write'],
    supportedAuthTypes: ['api-key'],
    metadata: { owner: 'platform' },
  };

  const connector: ConnectorDefinition = {
    manifest,
    async initialize() {
      return undefined;
    },
    async authenticate() {
      return { authenticated: true };
    },
    async discoverCapabilities() {
      return manifest.capabilities;
    },
    async validatePermissions() {
      return true;
    },
    async register() {
      return undefined;
    },
    async monitorHealth() {
      return { status: 'healthy', score: 100, details: { latencyMs: 12 } };
    },
    async executeAction() {
      return { success: true, data: { ok: true } };
    },
    async shutdown() {
      return undefined;
    },
  };

  const sdk = new ConnectorSDK();
  const registered = sdk.createConnector(connector);
  await registry.registerConnector(registered);

  const discovered = await registry.discoverCapabilities('demo-storage');
  assert.equal(discovered.length, 1);
  assert.equal(discovered[0].id, 'upload');
});

test('auth manager supports api keys, refresh, and rotation', async () => {
  const vault = new InMemoryCredentialVault();
  await vault.storeSecret('demo-storage', 'api-key', 'secret-1');
  const authManager = new DefaultAuthenticationManager(vault);

  const result = await authManager.authenticate('demo-storage', {
    method: 'api-key',
    config: { apiKey: 'secret-1' },
  });

  assert.equal(result.authenticated, true);
  assert.equal(result.provider, 'api-key');

  const refreshed = await authManager.refreshToken('demo-storage');
  assert.equal(refreshed.authenticated, true);

  const rotated = await authManager.rotateCredential('demo-storage', 'api-key', 'secret-2');
  assert.equal(rotated, true);
  assert.equal(await vault.getSecret('demo-storage', 'api-key'), 'secret-2');
});

test('webhooks validate signatures and process deliveries', async () => {
  const engine = new DefaultWebhookEngine();
  const deliveries: Array<{ event: string; payload: unknown }> = [];

  await engine.registerWebhook({
    id: 'webhook-1',
    name: 'Demo webhook',
    targetUrl: 'https://example.test/hook',
    secret: 'shared-secret',
    events: ['workflow.completed'],
    active: true,
  });

  await engine.subscribe('workflow.completed', async (event) => {
    deliveries.push({ event: event.type, payload: event.payload });
  });

  const accepted = await engine.processIncomingWebhook({
    id: 'evt-1',
    type: 'workflow.completed',
    payload: { ok: true },
    signature: 'sha256=' + 'abc',
    secret: 'shared-secret',
  });

  assert.equal(accepted, false);

  const valid = await engine.processIncomingWebhook({
    id: 'evt-2',
    type: 'workflow.completed',
    payload: { ok: true },
    signature: 'sha256=' + 'abc',
    secret: 'shared-secret',
    expectedSignature: 'sha256=abc',
  });

  assert.equal(valid, true);
  assert.equal(deliveries.length, 1);
});

test('retry manager and circuit breaker recover gracefully', async () => {
  const retryManager = new DefaultRetryManager({ maxAttempts: 3, backoffMs: 1 });
  let attempts = 0;
  const result = await retryManager.execute(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('transient');
    return 'ok';
  });

  assert.equal(result, 'ok');
  assert.equal(attempts, 3);

  const breaker = new DefaultCircuitBreakerManager({ failureThreshold: 2, resetTimeoutMs: 10 });
  await breaker.recordFailure('demo');
  await breaker.recordFailure('demo');
  const state = breaker.getState('demo');
  assert.equal(state, 'open');
});

test('health monitor evaluates connector health and exposes diagnostics', async () => {
  const monitor = new DefaultHealthMonitoringEngine();
  const snapshot = monitor.recordOutcome('storage', {
    success: true,
    latencyMs: 25,
    errorCount: 0,
  });

  assert.equal(snapshot.status, 'healthy');
  assert.equal(snapshot.score >= 80, true);
  assert.equal(snapshot.state, ConnectorLifecycleState.Healthy);
});
