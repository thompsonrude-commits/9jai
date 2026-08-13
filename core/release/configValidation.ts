import type { ConfigurationValidationResult, ConfigurationValidator } from './types';

export class DefaultConfigurationValidator implements ConfigurationValidator {
  async validate(input: { env: Record<string, string>; secrets: Record<string, string>; connectors: Record<string, unknown> }): Promise<ConfigurationValidationResult> {
    const issues: string[] = [];
    if (!input.env.NODE_ENV) issues.push('NODE_ENV is missing');
    if (!input.secrets.apiKey) issues.push('apiKey secret is missing');
    if (!input.connectors.storage) issues.push('storage connector is not configured');
    return { valid: issues.length === 0, issues };
  }
}
