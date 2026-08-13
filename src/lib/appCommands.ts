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

export function formatWeatherReport() {
  const now = new Date();
  const month = now.getMonth();
  const season = (month >= 3 && month <= 9) ? 'Rainy season' : 'Dry/Harmattan season';
  return `Weather report for Naija right now:
- Lagos: 28–34°C, ${season.includes('Rainy') ? 'afternoon showers and high humidity' : 'dry harmattan breeze with dust haze'}.
- Abuja: 25–36°C, ${season.includes('Rainy') ? 'possible thunderstorms later' : 'clear mornings and hot afternoons'}.
- Kano: 22–40°C, ${season.includes('Rainy') ? 'scattered rain showers' : 'very dry heat and dust'}.
- Port Harcourt: 26–32°C, humid with ${season.includes('Rainy') ? 'rain likely' : 'warm sunny spells'}.
- Benin City: 27–33°C, ${season.includes('Rainy') ? 'heavy rain in the evening' : 'moderate harmattan conditions'}.

Note: this is a general local forecast. For exact weather, check NIMET or your preferred local weather service.`;
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
