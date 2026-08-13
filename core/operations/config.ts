import type { ConfigurationEntry, ConfigurationService } from './types';

export class DefaultConfigurationService implements ConfigurationService {
  private values = new Map<string, string>();

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }
}
