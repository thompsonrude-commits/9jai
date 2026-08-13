import type { AlertManager, AlertRecord } from './types';

export class DefaultAlertManager implements AlertManager {
  private alerts: AlertRecord[] = [];

  async raise(alert: Omit<AlertRecord, 'id' | 'timestamp' | 'acknowledged'>): Promise<AlertRecord> {
    const record: AlertRecord = { id: `alert-${this.alerts.length + 1}`, acknowledged: false, timestamp: Date.now(), ...alert };
    this.alerts.push(record);
    return record;
  }

  async acknowledge(id: string): Promise<void> {
    const alert = this.alerts.find((entry) => entry.id === id);
    if (alert) alert.acknowledged = true;
  }

  list(): AlertRecord[] {
    return [...this.alerts];
  }
}
