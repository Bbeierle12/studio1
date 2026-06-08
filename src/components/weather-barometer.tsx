'use client';

import React from 'react';
import { Cloud, Sun, Wind, Eye, Droplets, Thermometer } from 'lucide-react';
import type { WeatherContext } from '@/lib/types';

interface WeatherBarometerProps {
  weatherContext: WeatherContext;
  className?: string;
}

/**
 * Weather Barometer Component
 * Displays current weather conditions in a tasteful chip format
 */
export default function WeatherBarometer({ 
  weatherContext, 
  className = '' 
}: WeatherBarometerProps) {
  const { weather, sun, location } = weatherContext;
  
  // Format time until sunset
  const formatTimeToSunset = (minutes: number): string => {
    if (minutes <= 0) return 'Past sunset';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };
  
  // Get AQI status and color
  const getAQIStatus = (aqi: number): { status: string; color: string } => {
    if (aqi <= 50) return { status: 'Good', color: 'text-success' };
    if (aqi <= 100) return { status: 'Moderate', color: 'text-warning' };
    if (aqi <= 150) return { status: 'Unhealthy (Sensitive)', color: 'text-warning' };
    if (aqi <= 200) return { status: 'Unhealthy', color: 'text-danger' };
    return { status: 'Very Unhealthy', color: 'text-danger' };
  };
  
  // Get wind status
  const getWindStatus = (speed: number): string => {
    if (speed < 5) return 'Calm';
    if (speed < 15) return 'Light';
    if (speed < 25) return 'Moderate';
    return 'Strong';
  };
  
  const aqiInfo = getAQIStatus(weather.aqi);
  
  return (
    <div className={`
      inline-flex items-center gap-3 px-4 py-2
      bg-card/80 backdrop-blur-sm border border-border
      rounded-full shadow-sm text-sm font-medium
      ${className}
    `}>
      {/* Feels Like Temperature */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Thermometer className="w-4 h-4 text-primary" />
        <span>Feels {weather.feelsLike}°F</span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-border" />

      {/* Rain Chance */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Droplets className="w-4 h-4 text-info" />
        <span>{weather.precipitation}% rain</span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-border" />

      {/* Wind */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Wind className="w-4 h-4 text-muted-foreground" />
        <span>{getWindStatus(weather.windSpeed)} ({weather.windSpeed} mph)</span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-border" />
      
      {/* AQI */}
      <div className="flex items-center gap-1.5">
        <Eye className="w-4 h-4 text-muted-foreground" />
        <span className={aqiInfo.color}>
          AQI {weather.aqi} ({aqiInfo.status})
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-border" />

      {/* Sunset */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {sun.isDaytime ? (
          <Sun className="w-4 h-4 text-warning" />
        ) : (
          <Cloud className="w-4 h-4 text-muted-foreground" />
        )}
        <span>
          {sun.isDaytime ? (
            <>Sunset in {formatTimeToSunset(sun.minutesToSunset)}</>
          ) : (
            <>Sunrise in {formatTimeToSunset(sun.minutesToSunrise)}</>
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version of the weather barometer for smaller spaces
 */
export function WeatherBarometerCompact({ 
  weatherContext, 
  className = '' 
}: WeatherBarometerProps) {
  const { weather, sun } = weatherContext;
  
  const formatTimeToSunset = (minutes: number): string => {
    if (minutes <= 0) return 'Night';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}:${remainingMins.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5
      bg-card/80 backdrop-blur-sm border border-border
      rounded-full shadow-sm text-xs font-medium text-muted-foreground
      ${className}
    `}>
      <span>{weather.feelsLike}°F</span>
      <span>•</span>
      <span>{weather.precipitation}%</span>
      <span>•</span>
      <span>{weather.windSpeed}mph</span>
      <span>•</span>
      <span>AQI {weather.aqi}</span>
      <span>•</span>
      <span>
        {sun.isDaytime ? 
          `🌅 ${formatTimeToSunset(sun.minutesToSunset)}` : 
          '🌙 Night'
        }
      </span>
    </div>
  );
}

/**
 * Loading state for the weather barometer
 */
export function WeatherBarometerSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`
      inline-flex items-center gap-3 px-4 py-2
      bg-muted border border-border
      rounded-full shadow-sm animate-pulse
      ${className}
    `}>
      <div className="h-4 w-16 bg-muted rounded" />
      <div className="w-px h-4 bg-muted" />
      <div className="h-4 w-12 bg-muted rounded" />
      <div className="w-px h-4 bg-muted" />
      <div className="h-4 w-14 bg-muted rounded" />
      <div className="w-px h-4 bg-muted" />
      <div className="h-4 w-16 bg-muted rounded" />
      <div className="w-px h-4 bg-muted" />
      <div className="h-4 w-20 bg-muted rounded" />
    </div>
  );
}