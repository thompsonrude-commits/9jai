import type { ConnectorDefinition } from './types';

export class ConnectorSandbox {
  async executeInSandbox(connector: ConnectorDefinition, action: string, payload?: unknown): Promise<unknown> {
    const fn = connector.executeAction;
    if (!fn) {
      return { success: false, error: 'Connector does not implement executeAction' };
    }
    return fn(action, payload);
  }
}
