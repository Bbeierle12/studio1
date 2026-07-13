import { WeatherForecast } from './types';
import { prisma } from './data';
import {
  buildDailyForecasts,
  isWeatherConfigured,
  roundCoord,
  WeatherUnavailableError,
  type OpenWeatherForecastResponse,
} from './weather-forecast';

const OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

/** OpenWeather's free forecast covers 5 days of 3-hour blocks. Nothing beyond that exists. */
export const FORECAST_HORIZON_DAYS = 5;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch the 5-day forecast for a specific point and collapse it into daily entries.
 *
 * Throws WeatherUnavailableError rather than returning invented data. There is no mock
 * fallback and no default location: if we cannot say what the weather is, we say that.
 */
export async function fetchWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
  if (!isWeatherConfigured()) {
    throw new WeatherUnavailableError('not_configured', 'OPENWEATHER_API_KEY is not set');
  }

  const url = `${OPENWEATHER_FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}`;

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 3600 } });
  } catch (error) {
    throw new WeatherUnavailableError(
      'upstream_error',
      `OpenWeather request failed: ${(error as Error).message}`
    );
  }

  if (!response.ok) {
    throw new WeatherUnavailableError(
      'upstream_error',
      `OpenWeather returned ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OpenWeatherForecastResponse;

  // city.timezone is the location's UTC offset in seconds — the input that makes day
  // bucketing correct for the place being forecast rather than for the server.
  const forecasts = buildDailyForecasts(data.list ?? [], data.city?.timezone ?? 0);

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
