'use client';

import { useMemo } from 'react';
import { Recipe } from '@/lib/types';
import { getSuggestedMeals, getCurrentSeason, MealSuggestion } from '@/lib/weather-meal-matcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, CloudRain, Sun, Cloud, Snowflake, Wind, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface WeatherSuggestionsProps {
  recipes: Recipe[];
  weather: {
    temperature: number;
    condition: string;
    precipitation?: number;
    humidity?: number;
  };
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  onSelectRecipe: (recipe: Recipe) => void;
  limit?: number;
}

export function WeatherSuggestions({
  recipes,
  weather,
  mealType,
  onSelectRecipe,
  limit = 5
}: WeatherSuggestionsProps) {
  const suggestions = useMemo(() => {
    const season = getCurrentSeason();
    const mealTypeString = mealType?.toLowerCase();
    
    return getSuggestedMeals(
      recipes,
      {
        temperature: weather.temperature,
        condition: weather.condition,
        precipitation: weather.precipitation || 0,
        humidity: weather.humidity,
        season
      },
      mealTypeString,
      limit
    );
  }, [recipes, weather, mealType, limit]);

  const getWeatherIcon = () => {
    const condition = weather.condition.toLowerCase();
    
    if (condition.includes('rain') || condition.includes('shower')) {
      return <CloudRain className="h-5 w-5 text-blue-500" />;
    }
    if (condition.includes('snow')) {
      return <Snowflake className="h-5 w-5 text-blue-300" />;
    }
    if (condition.includes('sun') || condition.includes('clear')) {
      return <Sun className="h-5 w-5 text-yellow-500" />;
    }
    if (condition.includes('cloud')) {
      return <Cloud className="h-5 w-5 text-gray-400" />;
    }
    if (condition.includes('wind')) {
      return <Wind className="h-5 w-5 text-gray-500" />;
    }
    
    return <Cloud className="h-5 w-5 text-gray-400" />;
  };

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No weather-based suggestions available</p>
        <p className="text-sm">Try adding more recipes with tags and descriptions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weather Context */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
        {getWeatherIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {Math.round(weather.temperature)}°F • {weather.condition}
          </p>
          <p className="text-xs text-muted-foreground">
            Suggestions based on current weather
          </p>
        </div>
      </div>

      {/* Suggestions List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.recipe.id}
              suggestion={suggestion}
              rank={index + 1}
              onSelect={() => onSelectRecipe(suggestion.recipe)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: MealSuggestion;
  rank: number;
  onSelect: () => void;
}

function SuggestionCard({ suggestion, rank, onSelect }: SuggestionCardProps) {
  const { recipe, score, reasons } = suggestion;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex gap-4">
          {/* Recipe Image */}
          <div className="relative w-24 h-24 flex-shrink-0 bg-muted">
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Sparkles className="h-8 w-8" />
              </div>
            )}
            
            {/* Rank Badge */}
            <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {rank}
            </div>
          </div>

          {/* Recipe Info */}
          <div className="flex-1 py-3 pr-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1">
                  {recipe.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {recipe.course && (
                    <span className="px-2 py-0.5 bg-secondary rounded-full">
                      {recipe.course}
                    </span>
                  )}
                  {recipe.prepTime && (
                    <span>{recipe.prepTime} min</span>
                  )}
                  {recipe.difficulty && (
                    <span>{recipe.difficulty}</span>
                  )}
                </div>

                {/* Reasons */}
                {reasons.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    {reasons[0]}
                  </p>
                )}
              </div>

              {/* Add Button */}
              <Button
                size="sm"
                onClick={onSelect}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Score Indicator */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {score}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
