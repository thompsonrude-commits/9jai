import type { IncidentManager, IncidentRecord } from './types';

export class DefaultIncidentManager implements IncidentManager {
  private incidents: IncidentRecord[] = [];

  async create(incident: Omit<IncidentRecord, 'id' | 'timestamp'>): Promise<IncidentRecord> {
    const record: IncidentRecord = { id: `incident-${this.incidents.length + 1}`, timestamp: Date.now(), ...incident };
    this.incidents.push(record);
    return record;
  }

  async update(id: string, patch: Partial<IncidentRecord>): Promise<IncidentRecord | undefined> {
    const incident = this.incidents.find((entry) => entry.id === id);
    if (!incident) return undefined;
    Object.assign(incident, patch);
    return incident;
  }

  list(): IncidentRecord[] {
    return [...this.incidents];
  }
}
