import { getAllHealthSnapshots } from '../logger';
import type { ProviderHealth, ProviderId } from '../types';
import { getProviderStatusDetails, isProviderDisabled, isSecretConfigured } from '../providers/secretHelpers';

export type ProviderVerificationReport = {
  providerId: ProviderId;
  displayName: string;
  secretName?: string;
  secretConfigured: boolean;
  disabled: boolean;
  status: 'disabled' | 'missing-secret' | 'auth-failed' | 'unavailable' | 'degraded' | 'healthy';
  health: ProviderHealth;
  ready: boolean;
  details: string;
};

const PROVIDER_CONFIG: Array<{
  providerId: ProviderId;
  displayName: string;
  secretName?: string;
}> = [
  { providerId: 'ollama', displayName: 'Ollama (self-hosted)' },
  { providerId: 'groq', displayName: 'Groq (hosted free tier)', secretName: 'GROQ_KEY' },
  { providerId: 'huggingface', displayName: 'HuggingFace', secretName: 'HF_KEY' },
  { providerId: 'pollinations', displayName: 'Pollinations' },
];

export async function getProviderVerificationReports(): Promise<Record<string, ProviderVerificationReport>> {
  const snapshots = getAllHealthSnapshots();

  return PROVIDER_CONFIG.reduce((reportMap, provider) => {
    const health = snapshots.find((snapshot) => snapshot.providerId === provider.providerId) ?? {
      providerId: provider.providerId,
      status: 'healthy',
      lastChecked: Date.now(),
      avgLatencyMs: 0,
      successRate: 0.5,
      consecutiveFailures: 0,
    };

    const disabled = isProviderDisabled(provider.providerId);
    const secretConfigured = isSecretConfigured(provider.secretName);
    const statusDetails = getProviderStatusDetails(health, !disabled, secretConfigured);
    const ready = statusDetails.status === 'healthy';

    reportMap[provider.providerId] = {
      providerId: provider.providerId,
      displayName: provider.displayName,
      secretName: provider.secretName,
      secretConfigured,
      disabled,
      status: statusDetails.status,
      health,
      ready,
      details: statusDetails.details,
    };

    return reportMap;
  }, {} as Record<string, ProviderVerificationReport>);
}
