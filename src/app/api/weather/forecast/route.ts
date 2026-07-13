import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  fetchWeatherForecast,
  getCachedWeatherForecast,
  FORECAST_HORIZON_DAYS,
} from '@/lib/weather-service';
import {
  addDaysToKey,
  enumerateDateKeys,
  WeatherUnavailableError,
} from '@/lib/weather-forecast';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/weather/forecast
 *
 * Query params (all required):
 * - start, end, today: "YYYY-MM-DD" in the *user's* local calendar
 * - lat, lon: the user's coordinates, from browser geolocation
 *
 * Coordinates are required on purpose. The previous implementation IP-geolocated from
 * inside the serverless function, which resolves the Vercel region rather than the user,
 * and fell back to hardcoded New York when that failed.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const today = searchParams.get('today');
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  if (!start || !end || !today || ![start, end, today].every(k => DATE_KEY.test(k))) {
    return NextResponse.json(
      { error: 'start, end and today are required as YYYY-MM-DD' },
      { status: 400 }
    );
  }

  if (!latParam || !lonParam) {
    return NextResponse.json(
      { error: 'Location required', reason: 'no_location' },
      { status: 400 }
    );
  }

  const lat = Number(latParam);
  const lon = Number(lonParam);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  // Only days the provider can actually speak to: the requested range intersected with
  // the 5-day forecast horizon. A month view legitimately asks for 31 days; 26 of them
  // have no forecast in existence, and inventing them is what got us here.
  const horizonEnd = addDaysToKey(today, FORECAST_HORIZON_DAYS - 1);
  const wanted = enumerateDateKeys(
    start < today ? today : start,
    end < horizonEnd ? end : horizonEnd
  );

  if (wanted.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const cached = await getCachedWeatherForecast(wanted, lat, lon);
    if (cached) {
      return NextResponse.json(cached);
    }

    const forecasts = await fetchWeatherForecast(lat, lon);
    return NextResponse.json(forecasts.filter(f => wanted.includes(f.dateKey)));
  } catch (error) {
    if (error instanceof WeatherUnavailableError) {
      // 503: the forecast is genuinely unavailable. The client renders that as "weather
      // unavailable" rather than showing a number it made up.
      console.error(`Weather unavailable (${error.reason}):`, error.message);
      return NextResponse.json(
        { error: 'Weather unavailable', reason: error.reason },
        { status: 503 }
      );
    }

    console.error('Error fetching weather forecast:', error);
    return NextResponse.json({ error: 'Failed to fetch weather forecast' }, { status: 500 });
  }
}
