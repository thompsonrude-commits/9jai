/**
 * Current Time Provider — FREE (Built-in Node.js)
 * 
 * Provides current time for any timezone
 * No API key required, no external dependencies
 * 
 * FREE-FIRST COMPLIANCE: ✅ YES
 */

export interface TimeData {
  time: string;
  date: string;
  timezone: string;
  timestamp: number;
  dayOfWeek: string;
  iso: string;
}

/**
 * Get current time for a timezone
 */
export function getCurrentTime(timezone = 'Africa/Lagos'): TimeData {
  const now = new Date();
  
  return {
    time: now.toLocaleTimeString('en-NG', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    date: now.toLocaleDateString('en-NG', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    dayOfWeek: now.toLocaleDateString('en-NG', {
      timeZone: timezone,
      weekday: 'long',
    }),
    timezone,
    timestamp: now.getTime(),
    iso: now.toISOString(),
  };
}

/**
 * Get current time for multiple timezones
 */
export function getMultipleTimezones(timezones: string[]): Record<string, TimeData> {
  const result: Record<string, TimeData> = {};
  
  for (const tz of timezones) {
    result[tz] = getCurrentTime(tz);
  }
  
  return result;
}

/**
 * Common Nigerian timezones/cities
 */
export const NIGERIAN_CITIES: Record<string, string> = {
  lagos: 'Africa/Lagos',
  abuja: 'Africa/Lagos',
  'port harcourt': 'Africa/Lagos',
  kano: 'Africa/Lagos',
  ibadan: 'Africa/Lagos',
  benin: 'Africa/Lagos',
  kaduna: 'Africa/Lagos',
  enugu: 'Africa/Lagos',
  aba: 'Africa/Lagos',
  nigeria: 'Africa/Lagos',
};

/**
 * Common African timezones
 */
export const AFRICAN_CITIES: Record<string, string> = {
  accra: 'Africa/Accra',
  nairobi: 'Africa/Nairobi',
  cairo: 'Africa/Cairo',
  johannesburg: 'Africa/Johannesburg',
  'cape town': 'Africa/Johannesburg',
  'addis ababa': 'Africa/Addis_Ababa',
  'dar es salaam': 'Africa/Dar_es_Salaam',
  kinshasa: 'Africa/Kinshasa',
  kigali: 'Africa/Kigali',
  kampala: 'Africa/Kampala',
};

/**
 * Get timezone from city name
 */
export function getTimezoneFromCity(city: string): string {
  const lower = city.toLowerCase();
  
  // Check Nigerian cities first
  if (NIGERIAN_CITIES[lower]) {
    return NIGERIAN_CITIES[lower];
  }
  
  // Check other African cities
  if (AFRICAN_CITIES[lower]) {
    return AFRICAN_CITIES[lower];
  }
  
  // Default: assume Africa/Lagos if unknown Nigerian city
  if (lower.includes('nigeria') || lower.includes('nigerian')) {
    return 'Africa/Lagos';
  }
  
  // Default: return as-is (might be valid IANA timezone)
  return city;
}

/**
 * Format time for natural language
 */
export function formatTimeNaturally(timeData: TimeData): string {
  return `It is currently ${timeData.time} on ${timeData.dayOfWeek}, ${timeData.date} in ${timeData.timezone.replace('Africa/', '')}`;
}

