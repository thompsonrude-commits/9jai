export interface DeviceLocationContext {
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
  timezone: string;
  source: 'device' | 'fallback';
}

const STORAGE_KEY = '9jai-location-context';

export function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export async function initLocationContext(): Promise<DeviceLocationContext> {
  const fallback: DeviceLocationContext = {
    timezone: getDeviceTimeZone(),
    source: 'fallback',
  };

  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // ignore storage failures
    }
    return fallback;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      });
    });

    const timezone = getDeviceTimeZone();
    const context: DeviceLocationContext = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timezone,
      source: 'device',
    };

    try {
      const reverseUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&language=en&format=json`;
      const reverseRes = await fetch(reverseUrl);
      if (reverseRes.ok) {
        const data = await reverseRes.json();
        const first = data?.results?.[0];
        if (first) {
          context.city = first.name || first.admin1 || first.country || undefined;
          context.region = first.admin1 || undefined;
          context.country = first.country || undefined;
        }
      }
    } catch {
      // ignore reverse geocoding failure; device location still works
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch {
      // ignore storage failures
    }

    return context;
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // ignore storage failures
    }
    return fallback;
  }
}

export function getCachedLocationContext(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function getCurrentLocationContext(): Promise<DeviceLocationContext> {
  const cached = getCachedLocationContext();
  if (cached) {
    try {
      return JSON.parse(cached) as DeviceLocationContext;
    } catch {
      // fall through to live detection
    }
  }
  return initLocationContext();
}

export function getDeviceTimeText(): string {
  const timezone = getDeviceTimeZone();
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-NG', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatter.format(now)} (${timezone})`;
}
