import { connectorEvents, ConnectorLifecycleState } from './types';
import type {
  ConnectorCapability,
  ConnectorHealthSnapshot,
  ConnectorRegistry,
  RegisteredConnector,
} from './types';

export class InMemoryConnectorRegistry implements ConnectorRegistry {
  private connectors = new Map<string, RegisteredConnector>();

  async registerConnector(connector: RegisteredConnector): Promise<void> {
    const state = connector.state ?? ConnectorLifecycleState.Registered;
    this.connectors.set(connector.manifest.id, { ...connector, state });
    connectorEvents.emit('ConnectorRegistered', { connectorId: connector.manifest.id, version: connector.manifest.version });
  }

  async unregisterConnector(connectorId: string): Promise<void> {
    this.connectors.delete(connectorId);
    connectorEvents.emit('ConnectorUnregistered', { connectorId });
  }

  async getConnector(connectorId: string): Promise<RegisteredConnector | undefined> {
    return this.connectors.get(connectorId);
  }

  async listConnectors(): Promise<RegisteredConnector[]> {
    return Array.from(this.connectors.values());
  }

  async discoverCapabilities(connectorId: string): Promise<ConnectorCapability[]> {
    const connector = this.connectors.get(connectorId);
    if (!connector) return [];

    const discovered = await connector.discoverCapabilities?.();
    if (!discovered) return connector.manifest.capabilities;
    if (Array.isArray(discovered)) return discovered;
    return [discovered];
  }

  async getHealth(connectorId: string): Promise<ConnectorHealthSnapshot | undefined> {
    const connector = this.connectors.get(connectorId);
    return connector?.lastHealth;
  }
}
