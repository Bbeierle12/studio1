import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  fetchWeatherForecast,
  getUserLocation,
  getCachedWeatherForecast
} from '@/lib/weather-service';

/**
 * GET /api/weather/forecast
 * Get weather forecast for meal planning
 * Query params:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - lat: latitude (optional, will auto-detect if not provided)
 * - lon: longitude (optional, will auto-detect if not provided)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedForecast = await getCachedWeatherForecast(
      new Date(startDate),
      new Date(endDate)
    );

    if (cachedForecast && cachedForecast.length > 0) {
      return NextResponse.json(cachedForecast);
    }

    // Get location
    let location;
    if (lat && lon) {
      location = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else {
      location = await getUserLocation();
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Fetch forecast
    const forecast = await fetchWeatherForecast(location.lat, location.lon, days);

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather forecast' },
      { status: 500 }
    );
  }
}
