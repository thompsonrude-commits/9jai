import { ConnectorLifecycleState, connectorEvents, type ConnectorDefinition, type RegisteredConnector } from './types';

export class ConnectorFramework {
  constructor(private readonly connectors: RegisteredConnector[] = []) {}

  async register(definition: ConnectorDefinition): Promise<RegisteredConnector> {
    const connector: RegisteredConnector = {
      ...definition,
      state: ConnectorLifecycleState.Uninitialized,
    };
    this.connectors.push(connector);
    connectorEvents.emit('ConnectorFrameworkRegistered', { connectorId: connector.manifest.id });
    return connector;
  }

  async initialize(connector: RegisteredConnector): Promise<void> {
    connector.state = ConnectorLifecycleState.Initialized;
    await connector.initialize?.();
    connector.state = ConnectorLifecycleState.Initialized;
    connectorEvents.emit('ConnectorInitialized', { connectorId: connector.manifest.id });
  }

  async authenticate(connector: RegisteredConnector, request?: { method: string; config?: Record<string, unknown> }): Promise<void> {
    connector.state = ConnectorLifecycleState.Authenticating;
    const result = await connector.authenticate?.(request);
    connector.state = result?.authenticated ? ConnectorLifecycleState.Authenticated : ConnectorLifecycleState.Failed;
  }

  async discover(connector: RegisteredConnector): Promise<void> {
    await connector.discoverCapabilities?.();
    connector.state = ConnectorLifecycleState.Registered;
  }

  async validate(connector: RegisteredConnector): Promise<void> {
    const isValid = await connector.validatePermissions?.();
    if (!isValid) {
      connector.state = ConnectorLifecycleState.Failed;
      throw new Error(`Connector ${connector.manifest.id} failed permission validation`);
    }
  }

  async registerWithPlatform(connector: RegisteredConnector): Promise<void> {
    await connector.register?.();
    connector.state = ConnectorLifecycleState.Registered;
  }

  async execute(connector: RegisteredConnector, ...args: unknown[]): Promise<unknown> {
    const result = await connector.executeAction?.(...args);
    if (result?.success) {
      connector.state = ConnectorLifecycleState.Healthy;
      return result;
    }
    connector.state = ConnectorLifecycleState.Degraded;
    return result;
  }

  async shutdown(connector: RegisteredConnector): Promise<void> {
    await connector.shutdown?.();
    connector.state = ConnectorLifecycleState.Shutdown;
  }
}
