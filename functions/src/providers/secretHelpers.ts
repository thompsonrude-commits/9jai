import * as path from 'path';
import * as dotenv from 'dotenv';
import type { ProviderId } from '../types';

const ENV_FILE = path.resolve(__dirname, '../../.env');
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: ENV_FILE, override: false });
}

interface SecretLike {
  value(): string | undefined;
}

const BOOLEAN_FALSE_VALUES = new Set(['0', 'false', 'off', 'no', 'disabled']);

const ENV_ALIASES: Record<string, string[]> = {
  GROK_KEY: ['XAI_API_KEY', 'GROK_API_KEY', 'GROK_KEY'],
  GROQ_KEY: ['GROQ_API_KEY', 'GROQ_KEY'],
  HF_KEY: ['HUGGINGFACE_API_KEY', 'HF_API_KEY', 'HUGGINGFACE_TOKEN', 'HF_TOKEN'],
  OPENAI_KEY: ['OPENAI_API_KEY', 'OPENAI_TOKEN'],
};

function getAlternativeEnvValues(secretName: string): Array<string | undefined> {
  const aliases = ENV_ALIASES[secretName] ?? [];
  return aliases.map(alias => process.env[alias]);
}

export function getSecretValue(secretName: string, secretParam?: SecretLike): string | undefined {
  const secretValue = secretParam?.value();
  if (typeof secretValue === 'string' && secretValue.trim().length > 0 && secretValue !== 'undefined') {
    return secretValue.trim();
  }

  const envValue = process.env[secretName];
  if (typeof envValue === 'string' && envValue.trim().length > 0 && envValue !== 'undefined') {
    return envValue.trim();
  }

  for (const altValue of getAlternativeEnvValues(secretName)) {
    if (typeof altValue === 'string' && altValue.trim().length > 0 && altValue !== 'undefined') {
      return altValue.trim();
    }
  }

  return undefined;
}

export function isSecretConfigured(secretName?: string, secretParam?: SecretLike): boolean {
  if (!secretName) return true;
  return Boolean(getSecretValue(secretName, secretParam));
}

export function isProviderDisabled(providerId: ProviderId): boolean {
  const upper = providerId.toUpperCase();
  const enabledKey = `PROVIDER_${upper}_ENABLED`;
  const disabledKey = `PROVIDER_${upper}_DISABLED`;
  const disableKey = `DISABLE_${upper}`;

  const enabledValue = process.env[enabledKey];
  const disabledValue = process.env[disabledKey];
  const disableValue = process.env[disableKey];

  if (typeof enabledValue === 'string' && BOOLEAN_FALSE_VALUES.has(enabledValue.trim().toLowerCase())) {
    return true;
  }

  const disabledValues = [disabledValue, disableValue].filter((value): value is string => typeof value === 'string');
  for (const value of disabledValues) {
    if (value.trim().toLowerCase() === 'true') {
      return true;
    }
  }

  return false;
}

export function getProviderStatusDetails(health: { status: string; consecutiveFailures: number; lastError?: string }, enabled: boolean, configured: boolean): {
  status: 'disabled' | 'missing-secret' | 'auth-failed' | 'unavailable' | 'degraded' | 'healthy';
  details: string;
} {
  if (!enabled) {
    return { status: 'disabled', details: 'provider disabled by environment configuration' };
  }
  if (!configured) {
    return { status: 'missing-secret', details: 'provider secret is missing or not configured' };
  }
  const error = health.lastError?.toLowerCase() ?? '';
  if (error.includes('401') || error.includes('403') || error.includes('unauthorized') || error.includes('forbidden') || error.includes('auth')) {
    return { status: 'auth-failed', details: 'authentication failed; verify provider secret and access permissions' };
  }
  if (health.status === 'down' || health.consecutiveFailures >= 5) {
    return { status: 'unavailable', details: 'provider currently unavailable due to repeated failures' };
  }
  if (health.status === 'degraded' || health.consecutiveFailures >= 2) {
    return { status: 'degraded', details: 'provider is degraded and may experience slower responses or partial failures' };
  }
  return { status: 'healthy', details: 'provider is healthy and ready to use' };
}

export function isProviderRoutable(providerId: ProviderId, secretName?: string, secretParam?: SecretLike): boolean {
  if (isProviderDisabled(providerId)) return false;
  if (!isSecretConfigured(secretName, secretParam)) return false;
  return true;
}
