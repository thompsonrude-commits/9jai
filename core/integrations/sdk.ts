import { ConnectorLifecycleState } from './types';
import type { ConnectorDefinition, RegisteredConnector } from './types';

export class ConnectorSDK {
  createConnector(definition: ConnectorDefinition): RegisteredConnector {
    return {
      ...definition,
      state: ConnectorLifecycleState.Uninitialized,
    };
  }

  async initialize(connector: RegisteredConnector): Promise<RegisteredConnector> {
    connector.state = ConnectorLifecycleState.Initialized;
    await connector.initialize?.();
    connector.state = ConnectorLifecycleState.Authenticated;
    return connector;
  }

  async authenticate(connector: RegisteredConnector, request?: { method: string; config?: Record<string, unknown> }): Promise<RegisteredConnector> {
    const result = await connector.authenticate?.(request);
    if (result?.authenticated) {
      connector.state = ConnectorLifecycleState.Authenticated;
    }
    return connector;
  }
}
