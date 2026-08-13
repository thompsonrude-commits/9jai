export interface ConnectorVersionRecord {
  id: string;
  version: string;
  compatibility: string[];
}

export class ConnectorVersionManager {
  private versions = new Map<string, ConnectorVersionRecord>();

  register(record: ConnectorVersionRecord): void {
    this.versions.set(record.id, record);
  }

  get(id: string): ConnectorVersionRecord | undefined {
    return this.versions.get(id);
  }

  isCompatible(id: string, targetVersion: string): boolean {
    const record = this.versions.get(id);
    if (!record) return false;
    return record.compatibility.includes(targetVersion);
  }
}
