import { WeatherForecast } from './types';
import { prisma } from './data';
import {
  isWeatherConfigured,
  roundCoord,
  WeatherUnavailableError,
} from './weather-forecast';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export const FORECAST_HORIZON_DAYS = 5;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function wmoToCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 3) return 'Clouds';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain';
  if (code >= 85 && code <= 86) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Clear';
}

function wmoToDescription(code: number): string {
  if (code === 0) return 'clear sky';
  if (code === 1) return 'mainly clear';
  if (code === 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain showers';
  if (code >= 85 && code <= 86) return 'snow showers';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'clear';
}

function wmoToIcon(code: number): string {
  if (code === 0) return '01d';
  if (code === 1) return '02d';
  if (code === 2) return '03d';
  if (code === 3) return '04d';
  if (code === 45 || code === 48) return '50d';
  if (code >= 51 && code <= 57) return '09d';
  if (code >= 61 && code <= 67) return '10d';
  if (code >= 71 && code <= 77) return '13d';
  if (code >= 80 && code <= 82) return '09d';
  if (code >= 85 && code <= 86) return '13d';
  if (code >= 95 && code <= 99) return '11d';
  return '01d';
}

/**
 * Fetch the 5-day forecast for a specific point.
 */
export async function fetchWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
  if (!isWeatherConfigured()) {
    throw new WeatherUnavailableError('not_configured', 'Weather is not configured');
  }

  const url = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=${FORECAST_HORIZON_DAYS}`;

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 3600 } });
  } catch (error) {
    throw new WeatherUnavailableError(
      'upstream_error',
      `Open-Meteo request failed: ${(error as Error).message}`
    );
  }

  if (!response.ok) {
    throw new WeatherUnavailableError(
      'upstream_error',
      `Open-Meteo returned ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const daily = data.daily;

  if (!daily || !daily.time) {
     return [];
  }

  const forecasts: WeatherForecast[] = daily.time.map((dateKey: string, i: number) => {
    const code = daily.weather_code[i];
    return {
      dateKey,
      temperature: {
        high: Math.round(daily.temperature_2m_max[i]),
        low: Math.round(daily.temperature_2m_min[i]),
        current: Math.round(daily.temperature_2m_max[i]), // approximation for day's representative temp
      },
      condition: wmoToCondition(code),
      description: wmoToDescription(code),
      precipitation: daily.precipitation_probability_max[i],
      windSpeed: Math.round(daily.wind_speed_10m_max[i]),
      icon: wmoToIcon(code)
    };
  });

  await cacheWeatherData(forecasts, lat, lon);

  return forecasts;
}

/**
 * Persist forecasts against the location they describe. The cache is keyed on
 * (dateKey, latitude, longitude): keyed on date alone, as it previously was, it became
 * a single global cache in which the first user to load the calendar served their own
 * city's weather to everyone else.
 */
async function cacheWeatherData(
  forecasts: WeatherForecast[],
  lat: number,
  lon: number
): Promise<void> {
  const latitude = roundCoord(lat);
  const longitude = roundCoord(lon);

  try {
    await Promise.all(
      forecasts.map(f =>
        prisma.weatherCache.upsert({
          where: {
            dateKey_latitude_longitude: { dateKey: f.dateKey, latitude, longitude },
          },
          update: {
            temperature: f.temperature,
            condition: f.condition,
            description: f.description,
            precipitation: f.precipitation,
            humidity: f.humidity,
            windSpeed: f.windSpeed,
            icon: f.icon,
            fetchedAt: new Date(),
          },
          create: {
            dateKey: f.dateKey,
            latitude,
            longitude,
            temperature: f.temperature,
            condition: f.condition,
            description: f.description,
            precipitation: f.precipitation,
            humidity: f.humidity,
            windSpeed: f.windSpeed,
            icon: f.icon,
          },
        })
      )
    );
  } catch (error) {
    // A cache write failure must not fail the request — the forecast itself is valid.
    console.error('Error caching weather data:', error);
  }
}

/**
 * Fresh cached forecasts for a location, covering the given day keys.
 *
 * Returns null unless the cache covers *every* requested day. The old code returned
 * whatever it found, so a 5-day cached window would satisfy a 31-day month view and
 * suppress the refetch for an hour.
 */
export async function getCachedWeatherForecast(
  dateKeys: string[],
  lat: number,
  lon: number
): Promise<WeatherForecast[] | null> {
  if (dateKeys.length === 0) return null;

  try {
    const cached = await prisma.weatherCache.findMany({
      where: {
        dateKey: { in: dateKeys },
        latitude: roundCoord(lat),
        longitude: roundCoord(lon),
        fetchedAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      orderBy: { dateKey: 'asc' },
    });

    if (cached.length < dateKeys.length) return null;

    return cached.map(c => ({
      dateKey: c.dateKey,
      temperature: c.temperature as { high: number; low: number; current: number },
      condition: c.condition,
      description: c.description ?? undefined,
      precipitation: c.precipitation,
      humidity: c.humidity ?? undefined,
      windSpeed: c.windSpeed ?? undefined,
      icon: c.icon ?? undefined,
    }));
  } catch (error) {
    console.error('Error reading cached weather:', error);
    return null;
  }
}
