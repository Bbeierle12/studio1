'use client';

import { useQuery } from '@tanstack/react-query';
import { WeatherForecast } from '@/lib/types';
import { toDateKey } from '@/lib/weather-forecast';
import { useGeolocation } from './use-geolocation';

export type WeatherUnavailableReason =
  | 'not_configured'
  | 'upstream_error'
  | 'no_location'
  | 'location_denied'
  | 'location_unsupported';

class WeatherFetchError extends Error {
  constructor(public readonly reason: WeatherUnavailableReason) {
    super(reason);
  }
}

async function fetchForecast(
  startKey: string,
  endKey: string,
  todayKey: string,
  coords: { lat: number; lon: number }
): Promise<WeatherForecast[]> {
  const params = new URLSearchParams({
    start: startKey,
    end: endKey,
    today: todayKey,
    lat: String(coords.lat),
    lon: String(coords.lon),
  });

  const response = await fetch(`/api/weather/forecast?${params}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new WeatherFetchError((body.reason as WeatherUnavailableReason) ?? 'upstream_error');
  }

  return response.json();
}

/**
 * Weather for a date range at the user's actual location.
 *
 * Returns an explicit `unavailableReason` rather than an empty forecast: the caller is
 * expected to tell the user *why* there is no weather, not silently render nothing (or,
 * as this app used to, render a fabricated forecast).
 */
export function useWeather(startDate?: Date, endDate?: Date) {
  const enabled = Boolean(startDate && endDate);
  const { coords, status: geoStatus } = useGeolocation(enabled);

  const startKey = startDate ? toDateKey(startDate) : undefined;
  const endKey = endDate ? toDateKey(endDate) : undefined;
  const todayKey = toDateKey(new Date());

  const { data, isLoading, error } = useQuery({
    queryKey: ['weather', startKey, endKey, todayKey, coords?.lat, coords?.lon],
    queryFn: () => fetchForecast(startKey!, endKey!, todayKey, coords!),
    enabled: enabled && geoStatus === 'granted' && Boolean(coords),
    staleTime: 60 * 60 * 1000, // 1 hour — matches the server-side cache TTL
    gcTime: 2 * 60 * 60 * 1000,
    retry: false, // a 503 "not configured" will not fix itself on retry
  });

  let unavailableReason: WeatherUnavailableReason | null = null;
  if (geoStatus === 'denied') unavailableReason = 'location_denied';
  else if (geoStatus === 'unsupported') unavailableReason = 'location_unsupported';
  else if (error instanceof WeatherFetchError) unavailableReason = error.reason;
  else if (error) unavailableReason = 'upstream_error';

  return {
    weatherForecast: data ?? [],
    isLoading: enabled && (geoStatus === 'loading' || isLoading),
    unavailableReason,
  };
}

/** The forecast for a calendar cell, matched on the local calendar day. */
export function getWeatherForDate(
  forecasts: WeatherForecast[],
  date: Date
): WeatherForecast | null {
  if (!forecasts?.length || !date) return null;
  const key = toDateKey(date);
  return forecasts.find(f => f.dateKey === key) ?? null;
}

/** Human-readable explanation for why there is no weather to show. */
export function weatherUnavailableMessage(reason: WeatherUnavailableReason): string {
  switch (reason) {
    case 'location_denied':
      return 'Enable location access to see weather-based meal suggestions.';
    case 'location_unsupported':
      return 'This browser cannot provide your location, so weather is unavailable.';
    case 'no_location':
      return 'Your location is required to show weather.';
    case 'not_configured':
      return 'Weather is not configured on this server.';
    case 'upstream_error':
    default:
      return 'Weather is temporarily unavailable.';
  }
}
