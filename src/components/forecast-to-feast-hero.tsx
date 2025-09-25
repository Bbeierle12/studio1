'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Users, ChefHat, Lightbulb, AlertCircle } from 'lucide-react';
import WeatherBarometer, { WeatherBarometerSkeleton } from './weather-barometer';
import { RecipeCard } from './recipe-card';
import type { WeatherContext, MealRecommendation } from '@/lib/types';
import { getClientWeatherContext } from '@/lib/weather';
import { getMealRecommendations, getWeatherSummary } from '@/lib/meal-recommendations';

/**
 * Get seasonal produce summary for display
 */
function getSeasonalProduce(season: 'spring' | 'summer' | 'fall' | 'winter', month: number): string {
  const seasonalData: Record<string, string[]> = {
    spring: ['asparagus', 'peas', 'lettuce', 'strawberries', 'artichokes'],
    summer: ['tomatoes', 'zucchini', 'corn', 'berries', 'stone fruits'],
    fall: ['pumpkin', 'squash', 'apples', 'sweet potatoes', 'cranberries'],
    winter: ['citrus fruits', 'root vegetables', 'kale', 'winter squash', 'leeks']
  };
  
  const produce = seasonalData[season] || [];
  if (produce.length <= 2) return produce.join(' and ');
  return produce.slice(0, -1).join(', ') + ', and ' + produce[produce.length - 1];
}

interface ForecastToFeastHeroProps {
  className?: string;
}

/**
 * Forecast-to-Feast Hero Component
 * Dynamic hero that transforms based on current weather conditions
 */
export default function ForecastToFeastHero({ className = '' }: ForecastToFeastHeroProps) {
  const [weatherContext, setWeatherContext] = useState<WeatherContext | null>(null);
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWeatherAndRecommendations() {
      try {
        setLoading(true);
        setError(null);
        
        // Get weather context
        const context = await getClientWeatherContext();
        if (!context) {
          throw new Error('Unable to get weather data');
        }
        
        setWeatherContext(context);
        
        // Get meal recommendations based on weather
        const mealRecs = await getMealRecommendations(context, {
          count: 3,
          maxPrepTime: context.isWeeknight ? 45 : undefined,
        });
        
        setRecommendations(mealRecs);
      } catch (err) {
        console.error('Error loading weather and recommendations:', err);
        setError('Unable to load weather-based recommendations');
      } finally {
        setLoading(false);
      }
    }

    loadWeatherAndRecommendations();
  }, []);

  if (loading) {
    return <ForecastToFeastHeroSkeleton className={className} />;
  }

  if (error || !weatherContext) {
    return (
      <div className={`bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 ${className}`}>
        <div className="flex items-center gap-3 text-orange-600 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Weather Data Unavailable</h2>
        </div>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t get current weather conditions for personalized recommendations.
          Browse our recipe collection instead!
        </p>
      </div>
    );
  }

  const weatherSummary = getWeatherSummary(weatherContext);

  return (
    <div className={`
      bg-gradient-to-br from-blue-50 via-white to-orange-50 
      rounded-xl p-6 lg:p-8 border border-gray-100 shadow-lg
      ${className}
    `}>
      {/* Header with Weather Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Forecast-to-Feast
          </h1>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {weatherContext.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-xs text-gray-400 capitalize">
              {weatherContext.season} • {weatherContext.location.city}
            </div>
          </div>
        </div>
        <p className="text-lg text-gray-600 mb-4">
          {weatherSummary}
        </p>
        
        {/* Weather Barometer */}
        <WeatherBarometer 
          weatherContext={weatherContext}
          className="mb-4"
        />
      </div>

      {/* Recipe Recommendations */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Perfect for Right Now
          </h2>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation.recipe.id}
                recommendation={recommendation}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No recipes match the current weather conditions.
            </p>
            <p className="text-sm text-gray-400">
              Try browsing our full recipe collection instead.
            </p>
          </div>
        )}

        {/* Weather & Seasonal Explanation */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-900 mb-1">
                    Why we&apos;re suggesting {recommendations[0].recipe.title}?
                  </h3>
                  <p className="text-sm text-amber-800">
                    {recommendations[0].reason}. Our algorithm considers temperature, 
                    precipitation, wind, air quality, time of day, and seasonal produce 
                    to suggest the most suitable cooking methods and ingredients.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Seasonal Produce Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">🌱</div>
                <div>
                  <h3 className="font-medium text-green-900 mb-1">
                    What&apos;s in Season Now ({weatherContext.season})
                  </h3>
                  <p className="text-sm text-green-800">
                    Peak season: {getSeasonalProduce(weatherContext.season, weatherContext.month)}.
                    Perfect time to enjoy the freshest flavors at their best quality and price!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual recommendation card component
 */
function RecommendationCard({ 
  recommendation, 
  index 
}: { 
  recommendation: MealRecommendation; 
  index: number;
}) {
  const { recipe, confidence, tags } = recommendation;
  
  return (
    <div className="relative group">
      {/* Confidence indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${confidence >= 0.8 ? 'bg-green-100 text-green-700' :
            confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'}
        `}>
          {Math.round(confidence * 100)}% match
        </div>
      </div>
      
      {/* Recipe Card */}
      <RecipeCard recipe={recipe} />
      
      {/* Weather tags */}
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            +{tags.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the hero component
 */
export function ForecastToFeastHeroSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`
      bg-gradient-to-br from-gray-50 to-gray-100 
      rounded-xl p-6 lg:p-8 border border-gray-200 animate-pulse
      ${className}
    `}>
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-64 bg-gray-300 rounded mb-2" />
        <div className="h-6 w-80 bg-gray-300 rounded mb-4" />
        <WeatherBarometerSkeleton className="mb-4" />
      </div>

      {/* Recommendations skeleton */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-300 rounded" />
          <div className="h-6 w-40 bg-gray-300 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-40 bg-gray-300 rounded-lg" />
              <div className="h-4 w-3/4 bg-gray-300 rounded" />
              <div className="h-4 w-1/2 bg-gray-300 rounded" />
              <div className="flex gap-1">
                <div className="h-6 w-12 bg-gray-300 rounded-full" />
                <div className="h-6 w-16 bg-gray-300 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Explanation skeleton */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-gray-300 rounded mt-0.5" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-300 rounded mb-2" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-300 rounded" />
                <div className="h-4 w-3/4 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}