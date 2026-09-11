import { useState, useEffect } from 'react';

export type CompactProvider = {
  providerId: string;
  displayName: string;
  implementationState: string;
  secretConfigured: boolean;
  disabled: boolean;
  reachable?: boolean;
  pingMs?: number | null;
  details?: string;
};

export default function useProviders() {
  const [providers, setProviders] = useState<CompactProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchProviders() {
      try {
        const res = await fetch('/api/v1/providers');
        if (!res.ok) throw new Error(`Failed to load providers: ${res.status}`);
        const data = await res.json();
        if (mounted) setProviders(data.data || []);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProviders();
    return () => { mounted = false; };
  }, []);

  return { providers, loading, error, refresh: () => window.location.reload() };
}
