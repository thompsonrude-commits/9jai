import type { SecretStore } from './types';

export class InMemorySecretStore implements SecretStore {
  private secrets = new Map<string, Map<string, string>>();

  async storeSecret(scope: string, key: string, value: string): Promise<void> {
    const bucket = this.secrets.get(scope) ?? new Map<string, string>();
    bucket.set(key, value);
    this.secrets.set(scope, bucket);
  }

  async getSecret(scope: string, key: string): Promise<string | undefined> {
    return this.secrets.get(scope)?.get(key);
  }

  async deleteSecret(scope: string, key: string): Promise<void> {
    this.secrets.get(scope)?.delete(key);
  }
}
