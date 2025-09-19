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
    if (aqi <= 50) return { status: 'Good', color: 'text-green-600' };
    if (aqi <= 100) return { status: 'Moderate', color: 'text-yellow-600' };
    if (aqi <= 150) return { status: 'Unhealthy (Sensitive)', color: 'text-orange-600' };
    if (aqi <= 200) return { status: 'Unhealthy', color: 'text-red-600' };
    return { status: 'Very Unhealthy', color: 'text-purple-600' };
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
      bg-white/80 backdrop-blur-sm border border-gray-200 
      rounded-full shadow-sm text-sm font-medium
      ${className}
    `}>
      {/* Feels Like Temperature */}
      <div className="flex items-center gap-1.5 text-gray-700">
        <Thermometer className="w-4 h-4 text-orange-500" />
        <span>Feels {weather.feelsLike}°F</span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-gray-300" />
      
      {/* Rain Chance */}
      <div className="flex items-center gap-1.5 text-gray-700">
        <Droplets className="w-4 h-4 text-blue-500" />
        <span>{weather.precipitation}% rain</span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-gray-300" />
      
      {/* Wind */}
      <div className="flex items-center gap-1.5 text-gray-700">
        <Wind className="w-4 h-4 text-gray-500" />
        <span>{getWindStatus(weather.windSpeed)} ({weather.windSpeed} mph)</span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-gray-300" />
      
      {/* AQI */}
      <div className="flex items-center gap-1.5">
        <Eye className="w-4 h-4 text-gray-500" />
        <span className={aqiInfo.color}>
          AQI {weather.aqi} ({aqiInfo.status})
        </span>
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 bg-gray-300" />
      
      {/* Sunset */}
      <div className="flex items-center gap-1.5 text-gray-700">
        {sun.isDaytime ? (
          <Sun className="w-4 h-4 text-yellow-500" />
        ) : (
          <Cloud className="w-4 h-4 text-gray-400" />
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
      bg-white/80 backdrop-blur-sm border border-gray-200 
      rounded-full shadow-sm text-xs font-medium text-gray-600
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
      bg-gray-100 border border-gray-200 
      rounded-full shadow-sm animate-pulse
      ${className}
    `}>
      <div className="h-4 w-16 bg-gray-300 rounded" />
      <div className="w-px h-4 bg-gray-300" />
      <div className="h-4 w-12 bg-gray-300 rounded" />
      <div className="w-px h-4 bg-gray-300" />
      <div className="h-4 w-14 bg-gray-300 rounded" />
      <div className="w-px h-4 bg-gray-300" />
      <div className="h-4 w-16 bg-gray-300 rounded" />
      <div className="w-px h-4 bg-gray-300" />
      <div className="h-4 w-20 bg-gray-300 rounded" />
    </div>
  );
}