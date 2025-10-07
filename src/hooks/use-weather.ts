'use client';

import { useQuery } from '@tanstack/react-query';
import { WeatherForecast } from '@/lib/types';

/**
 * Fetch weather forecast for a date range
 */
async function fetchWeatherForecast(
  startDate?: Date,
  endDate?: Date,
  lat?: number,
  lon?: number
): Promise<WeatherForecast[]> {
  if (!startDate || !endDate) {
    return [];
  }

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  if (lat && lon) {
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
  }

  const response = await fetch(`/api/weather/forecast?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather forecast');
  }
  
  return response.json();
}

/**
 * Hook to fetch weather forecast
 */
export function useWeather(
  startDate?: Date,
  endDate?: Date,
  location?: { lat: number; lon: number }
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['weather', startDate?.toISOString(), endDate?.toISOString(), location],
    queryFn: () => fetchWeatherForecast(startDate, endDate, location?.lat, location?.lon),
    enabled: !!startDate && !!endDate,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000 // 2 hours (formerly cacheTime)
  });

  return {
    weatherForecast: data || [],
    isLoading,
    error
  };
}

/**
 * Get weather for a specific date
 */
export function getWeatherForDate(
  forecasts: WeatherForecast[],
  date: Date
): WeatherForecast | null {
  if (!forecasts || !date) return null;
  
  try {
    const dateStr = date.toISOString().split('T')[0];
    return forecasts.find(f => {
      if (!f || !f.date) return false;
      const forecastDate = typeof f.date === 'string' ? new Date(f.date) : f.date;
      const forecastDateStr = forecastDate.toISOString().split('T')[0];
      return forecastDateStr === dateStr;
    }) || null;
  } catch (error) {
    console.error('Error in getWeatherForDate:', error);
    return null;
  }
}
