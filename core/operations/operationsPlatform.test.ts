import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DefaultDashboardEngine,
  DefaultWidgetFramework,
  DefaultMetricsAggregator,
  DefaultLogAggregationEngine,
  DefaultAlertManager,
  DefaultIncidentManager,
  DefaultConfigurationService,
  DefaultReportGenerator,
  DefaultSearchEngine,
  DefaultReleaseManager,
} from './index.js';

test('dashboard engine builds a platform overview', async () => {
  const dashboard = new DefaultDashboardEngine();
  const overview = await dashboard.getOverview();
  assert.equal(overview.platformHealth, 'healthy');
  assert.equal(overview.activeServices > 0, true);
});

test('widget framework stores and renders widgets', async () => {
  const widgets = new DefaultWidgetFramework();
  await widgets.register({ id: 'widget-1', title: 'CPU', kind: 'metric' });
  const rendered = widgets.render('widget-1');
  assert.equal(rendered.title, 'CPU');
});

test('metrics aggregator summarizes platform metrics', async () => {
  const metrics = new DefaultMetricsAggregator();
  metrics.record({ name: 'cpu', value: 62 });
  metrics.record({ name: 'gpu', value: 81 });
  const summary = metrics.summary();
  assert.equal(summary.cpu, 62);
  assert.equal(summary.gpu, 81);
});

test('log aggregation and alerts support search and acknowledgement', async () => {
  const logs = new DefaultLogAggregationEngine();
  await logs.ingest({ level: 'error', source: 'engine', message: 'Model failed', correlationId: 'corr-1' });
  const results = await logs.search('Model');
  assert.equal(results.length, 1);
  const alertManager = new DefaultAlertManager();
  const alert = await alertManager.raise({ severity: 'critical', message: 'Connector failure' });
  await alertManager.acknowledge(alert.id);
  const current = alertManager.list();
  assert.equal(current[0].acknowledged, true);
});

test('incident, config, report, search, and release operations work end to end', async () => {
  const incidents = new DefaultIncidentManager();
  const incident = await incidents.create({ title: 'Service degradation', severity: 'high' });
  await incidents.update(incident.id, { status: 'resolved' });
  const config = new DefaultConfigurationService();
  await config.set('feature.flags.new-ui', 'enabled');
  const report = new DefaultReportGenerator();
  const generated = report.generate({ format: 'json', title: 'Daily Ops' });
  assert.equal(generated.format, 'json');
  const search = new DefaultSearchEngine();
  const hits = await search.search('feature');
  assert.equal(hits.length >= 1, true);
  const releaseManager = new DefaultReleaseManager();
  const readiness = await releaseManager.checkReadiness({ version: '1.2.3' });
  assert.equal(readiness.ready, true);
});
