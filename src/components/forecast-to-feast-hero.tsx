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
      <div className={`bg-background bg-[radial-gradient(120%_90%_at_80%_0%,hsl(var(--meal-dinner)/0.12)_0%,transparent_55%)] rounded-xl p-8 ${className}`}>
        <div className="flex items-center gap-3 text-warning mb-4">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Weather Data Unavailable</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t get current weather conditions for personalized recommendations.
          Browse our recipe collection instead!
        </p>
      </div>
    );
  }

  const weatherSummary = getWeatherSummary(weatherContext);

  return (
    <div className={`
      bg-card bg-[radial-gradient(120%_90%_at_80%_0%,hsl(var(--meal-dinner)/0.12)_0%,transparent_55%)]
      rounded-xl p-6 lg:p-8 border border-border shadow-lg
      ${className}
    `}>
      {/* Header with Weather Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Forecast-to-Feast
          </h1>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {weatherContext.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {weatherContext.season} • {weatherContext.location.city}
            </div>
          </div>
        </div>
        <p className="text-lg text-muted-foreground mb-4">
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
          <ChefHat className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
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
            <p className="text-muted-foreground mb-4">
              No recipes match the current weather conditions.
            </p>
            <p className="text-sm text-muted-foreground">
              Try browsing our full recipe collection instead.
            </p>
          </div>
        )}

        {/* Weather & Seasonal Explanation */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="bg-warning-muted border border-warning/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-warning mb-1">
                    Why we&apos;re suggesting {recommendations[0].recipe.title}?
                  </h3>
                  <p className="text-sm text-warning">
                    {recommendations[0].reason}. Our algorithm considers temperature, 
                    precipitation, wind, air quality, time of day, and seasonal produce 
                    to suggest the most suitable cooking methods and ingredients.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Seasonal Produce Info */}
            <div className="bg-success-muted border border-success/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-success mt-0.5 flex-shrink-0">🌱</div>
                <div>
                  <h3 className="font-medium text-success mb-1">
                    What&apos;s in Season Now ({weatherContext.season})
                  </h3>
                  <p className="text-sm text-success">
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
          ${confidence >= 0.8 ? 'bg-success-muted text-success' :
            confidence >= 0.6 ? 'bg-warning-muted text-warning' :
            'bg-muted text-muted-foreground'}
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
            className="px-2 py-1 bg-info-muted text-info rounded-full text-xs font-medium"
          >
            {tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
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
      bg-muted
      rounded-xl p-6 lg:p-8 border border-border animate-pulse
      ${className}
    `}>
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-64 bg-muted rounded mb-2" />
        <div className="h-6 w-80 bg-muted rounded mb-4" />
        <WeatherBarometerSkeleton className="mb-4" />
      </div>

      {/* Recommendations skeleton */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted rounded" />
          <div className="h-6 w-40 bg-muted rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-40 bg-muted rounded-lg" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="flex gap-1">
                <div className="h-6 w-12 bg-muted rounded-full" />
                <div className="h-6 w-16 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Explanation skeleton */}
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-muted rounded mt-0.5" />
            <div className="flex-1">
              <div className="h-5 w-32 bg-muted rounded mb-2" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}