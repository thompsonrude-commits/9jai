import { ConnectorLifecycleState, type ConnectorHealthSnapshot, type HealthMonitoringEngine } from './types';

export class DefaultHealthMonitoringEngine implements HealthMonitoringEngine {
  private snapshots = new Map<string, ConnectorHealthSnapshot>();

  recordOutcome(connectorId: string, outcome: { success: boolean; latencyMs: number; errorCount: number }): ConnectorHealthSnapshot {
    const score = outcome.success
      ? Math.max(80, 100 - Math.min(outcome.latencyMs, 20))
      : 40;
    const state = outcome.success
      ? ConnectorLifecycleState.Healthy
      : ConnectorLifecycleState.Degraded;

    const snapshot: ConnectorHealthSnapshot = {
      status: outcome.success ? 'healthy' : 'degraded',
      score,
      state,
      details: {
        latencyMs: outcome.latencyMs,
        errorCount: outcome.errorCount,
      },
    };

    this.snapshots.set(connectorId, snapshot);
    return snapshot;
  }

  getSnapshot(connectorId: string): ConnectorHealthSnapshot | undefined {
    return this.snapshots.get(connectorId);
  }
}
