import type { DiagnosticsInterface } from './types';

export class DefaultDiagnosticsInterface implements DiagnosticsInterface {
  private diagnostics = new Map<string, Record<string, unknown>>();

  getDiagnostics(connectorId: string): Record<string, unknown> {
    return this.diagnostics.get(connectorId) ?? { connectorId, status: 'unknown' };
  }

  setDiagnostics(connectorId: string, diagnostics: Record<string, unknown>): void {
    this.diagnostics.set(connectorId, diagnostics);
  }
}
