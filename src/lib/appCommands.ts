export type AppTheme = 'default' | 'dark' | 'blue' | 'forest' | 'sunset';

export interface AppCommand {
  command: 'clearChat' | 'setTheme' | 'weather' | 'openLanguages' | 'help';
  value?: string;
}

const KNOWN_THEMES: Record<string, AppTheme> = {
  default: 'default',
  normal: 'default',
  light: 'default',
  dark: 'dark',
  night: 'dark',
  blue: 'blue',
  ocean: 'blue',
  sea: 'blue',
  forest: 'forest',
  green: 'forest',
  sunset: 'sunset',
  orange: 'sunset',
  gold: 'sunset',
};

const THEME_STYLES: Record<AppTheme, { backgroundColor: string; color: string; accent: string }> = {
  default: { backgroundColor: '#ffffff', color: '#111827', accent: '#008751' },
  dark: { backgroundColor: '#0f172a', color: '#e2e8f0', accent: '#22c55e' },
  blue: { backgroundColor: '#eff6ff', color: '#0f172a', accent: '#2563eb' },
  forest: { backgroundColor: '#ecfdf5', color: '#134e4a', accent: '#0f766e' },
  sunset: { backgroundColor: '#fff7ed', color: '#7c2d12', accent: '#f97316' },
};

export function getThemeStyle(theme: string) {
  const key = normalizeTheme(theme);
  return THEME_STYLES[key] || THEME_STYLES.default;
}

export function normalizeTheme(value: string | undefined): AppTheme {
  if (!value) return 'default';
  const clean = value.trim().toLowerCase();
  return KNOWN_THEMES[clean] || 'default';
}

export function loadSavedTheme(): AppTheme {
  if (typeof window === 'undefined') return 'default';
  const saved = window.localStorage.getItem('app_theme');
  return normalizeTheme(saved || 'default');
}

export function applyTheme(theme: string): AppTheme {
  if (typeof document === 'undefined') return 'default';
  const normalized = normalizeTheme(theme);
  const body = document.body;
  Object.keys(KNOWN_THEMES).forEach((key) => {
    body.classList.remove(`theme-${normalizeTheme(key)}`);
  });
  body.classList.add(`theme-${normalized}`);
  window.localStorage.setItem('app_theme', normalized);
  return normalized;
}

import { getCurrentLocationContext, getDeviceTimeZone } from './locationService';

export async function formatWeatherReport(cityOverride?: string): Promise<string> {
try {
  const location = await getCurrentLocationContext();
  const timezone = location.timezone || getDeviceTimeZone();
  const targetCity = cityOverride || location.city || 'your location';

  if (location.latitude && location.longitude) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(weatherUrl, { headers: { Accept: 'application/json' } });
    if (response.ok) {
      const weather = await response.json();
      const current = weather?.current;
      if (current) {
        const temp = current.temperature_2m ?? 'n/a';
        const feels = current.apparent_temperature ?? 'n/a';
        const wind = current.wind_speed_10m ?? 'n/a';
        const humidity = current.relative_humidity_2m ?? 'n/a';
        return `Weather for ${targetCity} right now: ${temp}°C, feels like ${feels}°C, humidity ${humidity}%, wind ${wind} km/h. Timezone: ${timezone}.`;
      }
    }
  }

  const now = new Date();
  const month = now.getMonth();
  const season = (month >= 3 && month <= 9) ? 'Rainy season' : 'Dry/Harmattan season';
  return `Weather report for ${targetCity} right now:
- Local conditions: ${season.includes('Rainy') ? 'warm and likely humid with rain around' : 'dry and sunny with warm conditions'}.
- Timezone: ${timezone}.
- For exact conditions, tell me your city so I can be more specific.`;
} catch {
  return 'I no fit check the weather right now. Tell me your city or allow location access and I go give you the local condition.';
}
}

export function parseAppCommand(message: string): AppCommand | null {
  const text = message.trim().toLowerCase();
  if (!text) return null;

  const clearMatchers = [
    /(?:clear|reset|wipe|delete).*(?:chat|conversation|history)/,
    /^(?:new chat|start over|start again|restart chat|fresh chat)/,
  ];
  if (clearMatchers.some((re) => re.test(text))) {
    return { command: 'clearChat' };
  }

  const themeMatchers = [
    /(?:change|set|use|switch).*(?:theme|color|mode)/,
    /(?:dark mode|light mode|blue theme|forest theme|sunset theme|ocean theme|green theme)/,
    /(?:set.*theme to|use.*theme|switch.*theme to|change.*theme to)/,
  ];
  if (themeMatchers.some((re) => re.test(text))) {
    const match = text.match(/(dark|light|blue|ocean|forest|green|sunset|orange|gold|night|day)/);
    const themeName = match?.[1] || 'default';
    return { command: 'setTheme', value: normalizeTheme(themeName) };
  }

  if (/(?:weather|forecast|temperature|rain|sunny|hot|cold|humidity|storm)/.test(text) && !/(?:generate|image|photo|logo|draw)/.test(text)) {
    return { command: 'weather' };
  }

  if (/(?:open|go to|show|launch).*(?:languages|language menu|language page|language list|Naija languages)/.test(text)) {
    return { command: 'openLanguages' };
  }

  if (/(?:help|commands|what can you do|how do i|show me.*commands)/.test(text)) {
    return { command: 'help' };
  }

  return null;
}

export function getThemeHelpText() {
  return `Try these commands:
- "Clear chat history"
- "Start a new chat"
- "Change theme to dark"
- "Set theme to blue"
- "Show me the weather"
- "Open languages menu"
- "What can you do?"`;
}
