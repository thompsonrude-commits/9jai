import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DefaultReleaseEngineeringService,
  DefaultPackagingService,
  DefaultConfigurationValidator,
  DefaultUpgradePlanner,
  DefaultRollbackPlanner,
  DefaultDependencyAuditor,
  DefaultCompatibilityChecker,
  DefaultReleaseCertificationEngine,
} from './index.js';

test('release engineering service computes semantic versions and manifests', async () => {
  const service = new DefaultReleaseEngineeringService();
  const manifest = await service.createRelease({ version: '1.2.3-rc.1', channel: 'rc', summary: 'Release candidate' });
  assert.equal(manifest.version, '1.2.3-rc.1');
  assert.equal(manifest.channel, 'rc');
});

test('packaging service emits signed package metadata and checksums', async () => {
  const packaging = new DefaultPackagingService();
  const artifact = await packaging.buildArtifact({ name: 'platform', version: '1.2.3-rc.1' });
  assert.equal(artifact.signed, true);
  assert.equal(artifact.checksum.length > 0, true);
});

test('configuration validator checks required platform settings', async () => {
  const validator = new DefaultConfigurationValidator();
  const result = await validator.validate({
    env: { NODE_ENV: 'production' },
    secrets: { apiKey: 'abc' },
    connectors: { storage: true },
  });
  assert.equal(result.valid, true);
});

test('upgrade and rollback planners prepare migrations and recovery steps', async () => {
  const upgrade = new DefaultUpgradePlanner();
  const rollback = new DefaultRollbackPlanner();
  const plan = await upgrade.plan({ fromVersion: '1.2.2', toVersion: '1.2.3-rc.1' });
  const rollbackPlan = await rollback.plan({ version: '1.2.3-rc.1' });
  assert.equal(plan.steps.length > 0, true);
  assert.equal(rollbackPlan.steps.length > 0, true);
});

test('dependency audit and compatibility checks produce release readiness', async () => {
  const auditor = new DefaultDependencyAuditor();
  const compatibility = new DefaultCompatibilityChecker();
  const certification = new DefaultReleaseCertificationEngine();
  const audit = await auditor.audit([{ name: 'react', version: '19.0.0' }, { name: 'typescript', version: '5.8.2' }]);
  const compatibilityResult = await compatibility.check({ fromVersion: '1.2.2', toVersion: '1.2.3-rc.1' });
  const readiness = await certification.certify({
    version: '1.2.3-rc.1',
    dependencies: audit.dependencies,
    compatibility: compatibilityResult,
  });
  assert.equal(readiness.ready, true);
  assert.equal(readiness.score >= 80, true);
});
