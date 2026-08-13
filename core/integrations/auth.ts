import { createHash } from 'crypto';
import type {
  AuthenticationManager,
  ConnectorAuthRequest,
  ConnectorAuthResult,
  CredentialVault,
  SecretProvider,
} from './types';

export class InMemoryCredentialVault implements CredentialVault, SecretProvider {
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

  async listSecrets(scope: string): Promise<string[]> {
    return Array.from(this.secrets.get(scope)?.keys() ?? []);
  }
}

export class DefaultAuthenticationManager implements AuthenticationManager {
  constructor(private readonly vault: CredentialVault | SecretProvider) {}

  async authenticate(connectorId: string, request: ConnectorAuthRequest): Promise<ConnectorAuthResult> {
    const method = request.method ?? 'api-key';
    const config = request.config ?? {};

    if (method === 'api-key') {
      const apiKey = (config.apiKey as string | undefined) ?? (await this.vault.getSecret(connectorId, 'api-key'));
      if (apiKey) {
        await this.vault.storeSecret(connectorId, 'api-key', apiKey);
        const refreshToken = createHash('sha256').update(`${connectorId}:${apiKey}`).digest('hex');
        await this.vault.storeSecret(connectorId, 'refresh-token', refreshToken);
        return { authenticated: true, provider: 'api-key', details: { connectorId, secretStored: true } };
      }
    }

    if (method === 'oauth2' || method === 'oidc') {
      const token = (config.token as string | undefined) ?? (await this.vault.getSecret(connectorId, method));
      if (token) {
        return { authenticated: true, provider: method, token, details: { connectorId } };
      }
    }

    return { authenticated: false, provider: method, details: { connectorId } };
  }

  async refreshToken(connectorId: string): Promise<ConnectorAuthResult> {
    const current = await this.vault.getSecret(connectorId, 'refresh-token');
    const fallback = await this.vault.getSecret(connectorId, 'api-key');
    const base = current ?? fallback;
    if (!base) {
      return { authenticated: false, provider: 'refresh-token', details: { connectorId } };
    }

    const refreshed = createHash('sha256').update(`${connectorId}:${base}`).digest('hex');
    await this.vault.storeSecret(connectorId, 'refresh-token', refreshed);
    return { authenticated: true, provider: 'refresh-token', token: refreshed, details: { connectorId } };
  }

  async rotateCredential(connectorId: string, key: string, newValue: string): Promise<boolean> {
    await this.vault.storeSecret(connectorId, key, newValue);
    return true;
  }
}
