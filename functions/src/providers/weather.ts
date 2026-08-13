/**
 * Weather Provider — Open-Meteo API (FREE, NO API KEY)
 * 
 * Open-Meteo provides free weather data without API key
 * https://open-meteo.com/
 * 
 * FREE-FIRST COMPLIANCE: ✅ YES
 */

export interface WeatherData {
  location: string;
  temperature: number;
  temperatureUnit: string;
  condition: string;
  weatherCode: number;
  windSpeed: number;
  windUnit: string;
  humidity?: number;
  precipitation?: number;
  forecast: Array<{
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    condition: string;
    weatherCode: number;
  }>;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Get weather for a location
 */
export async function getWeather(location: string): Promise<WeatherData> {
  // Step 1: Geocode location
  const { latitude, longitude, name } = await geocodeLocation(location);
  
  // Step 2: Get weather data
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto&temperature_unit=celsius&windspeed_unit=kmh`;
  
  const weatherRes = await fetch(weatherUrl, {
    signal: AbortSignal.timeout(10000),
  });
  
  if (!weatherRes.ok) {
    throw new Error(`Weather API failed: ${weatherRes.status}`);
  }
  
  const weatherData = await weatherRes.json() as any;
  const current = weatherData.current_weather;
  const daily = weatherData.daily;
  
  return {
    location: name,
    temperature: current.temperature,
    temperatureUnit: '°C',
    condition: getWeatherCondition(current.weathercode),
    weatherCode: current.weathercode,
    windSpeed: current.windspeed,
    windUnit: 'km/h',
    humidity: undefined, // Not in free tier
    precipitation: daily.precipitation_sum?.[0],
    forecast: daily.time.slice(0, 7).map((date: string, i: number) => ({
      date,
      temperatureMax: daily.temperature_2m_max[i],
      temperatureMin: daily.temperature_2m_min[i],
      condition: getWeatherCondition(daily.weathercode[i]),
      weatherCode: daily.weathercode[i],
    })),
    coordinates: { latitude, longitude },
  };
}

/**
 * Geocode location to coordinates
 */
async function geocodeLocation(location: string): Promise<{
  name: string;
  latitude: number;
  longitude: number;
}> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
  
  const geoRes = await fetch(geoUrl, {
    signal: AbortSignal.timeout(5000),
  });
  
  if (!geoRes.ok) {
    throw new Error(`Geocoding failed: ${geoRes.status}`);
  }
  
  const geoData = await geoRes.json() as any;
  
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Location not found: ${location}`);
  }
  
  const result = geoData.results[0];
  return {
    name: result.name + (result.country ? `, ${result.country}` : ''),
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

/**
 * Map WMO weather codes to conditions
 */
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return conditions[code] || 'Unknown';
}

/**
 * Format weather for natural language
 */
export function formatWeatherNaturally(weather: WeatherData): string {
  return `The weather in ${weather.location} is currently ${weather.condition.toLowerCase()} with a temperature of ${weather.temperature}${weather.temperatureUnit}. Wind speed is ${weather.windSpeed} ${weather.windUnit}.`;
}

/**
 * Get weather with automatic retry
 */
export async function getWeatherWithRetry(
  location: string,
  maxRetries = 2
): Promise<WeatherData> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await getWeather(location);
    } catch (err: any) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Weather request failed after retries');
}

