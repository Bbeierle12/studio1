'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { PlannedMeal, WeatherForecast } from '@/lib/types';
import {
  getTimeUntilMeal,
  formatMealTimes,
  getMealTypeEmoji,
  getMealTypeLabel,
  getOtherMeals
} from '@/lib/calendar-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, MoreVertical, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FeaturedTodayCardProps {
  date: Date;
  meals: PlannedMeal[];
  featuredMeal: PlannedMeal | null;
  weather?: WeatherForecast | null;
  onStartCooking?: (meal: PlannedMeal) => void;
  onViewRecipe?: (meal: PlannedMeal) => void;
  onEditMeal?: (meal: PlannedMeal) => void;
  onDeleteMeal?: (meal: PlannedMeal) => void;
  onAddMeal?: () => void;
}

export function FeaturedTodayCard({
  date,
  meals,
  featuredMeal,
  weather,
  onStartCooking,
  onViewRecipe,
  onEditMeal,
  onDeleteMeal,
  onAddMeal
}: FeaturedTodayCardProps) {
  const [countdown, setCountdown] = useState(getTimeUntilMeal());
  const otherMeals = featuredMeal ? getOtherMeals(meals, featuredMeal) : meals;

  // Update countdown every minute
  useEffect(() => {
    if (!featuredMeal) return;

    const interval = setInterval(() => {
      setCountdown(getTimeUntilMeal());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [featuredMeal]);

  // Empty state - no meals planned for today
  if (!featuredMeal && meals.length === 0) {
    return (
      <div
        className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-6 space-y-4 ring-2 ring-primary/20 min-h-[300px] flex flex-col justify-center"
        role="main"
        aria-label={`Today: ${format(date, 'EEEE MMMM d')}, no meals planned`}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge className="bg-primary text-primary-foreground mb-2">TODAY</Badge>
          <h3 className="text-lg font-bold">
            {format(date, 'EEEE, MMMM d')}
          </h3>
          {weather && (
            <p className="text-sm text-muted-foreground">
              🌡️ {weather.temperature.current}° {weather.condition}
            </p>
          )}
        </div>

        {/* Empty State Content */}
        <div className="text-center space-y-4 py-6">
          <div className="text-4xl mb-2">🍽️</div>
          <p className="text-lg font-medium">No meals planned yet</p>

          {weather && weather.temperature.current < 60 && (
            <div className="text-sm text-muted-foreground max-w-md mx-auto">
              <p className="mb-3">
                It&apos;s {weather.temperature.current}° and {weather.condition.toLowerCase()}—perfect
                soup weather!
              </p>
              <div className="space-y-1 text-left bg-muted/30 rounded-lg p-3">
                <p className="font-medium mb-2">Suggestions:</p>
                <p>• 🍲 Chicken Noodle Soup</p>
                <p>• 🥘 Beef Stew</p>
                <p>• 🍜 Ramen</p>
              </div>
            </div>
          )}

          {weather && weather.temperature.current >= 60 && (
            <div className="text-sm text-muted-foreground max-w-md mx-auto">
              <p className="mb-3">
                It&apos;s a beautiful {weather.temperature.current}° day!
              </p>
              <div className="space-y-1 text-left bg-muted/30 rounded-lg p-3">
                <p className="font-medium mb-2">Suggestions:</p>
                <p>• 🥗 Fresh Summer Salad</p>
                <p>• 🌮 Grilled Tacos</p>
                <p>• 🍕 Pizza on the Patio</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center pt-2">
            <Button onClick={onAddMeal}>
              <Plus className="h-4 w-4 mr-2" />
              Plan Meal
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recipes">Browse Recipes</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No featured meal but has other meals
  if (!featuredMeal && meals.length > 0) {
    return (
      <div
        className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-6 space-y-4 ring-2 ring-primary/20 min-h-[300px]"
        role="main"
        aria-label={`Today: ${format(date, 'EEEE MMMM d')}`}
      >
        {/* Header */}
        <div className="space-y-1">
          <Badge className="bg-primary text-primary-foreground mb-2">TODAY</Badge>
          <h3 className="text-lg font-bold">
            {format(date, 'EEEE, MMMM d')}
          </h3>
          {weather && (
            <p className="text-sm text-muted-foreground">
              🌡️ {weather.temperature.current}° {weather.condition}
            </p>
          )}
        </div>

        {/* All Meals List */}
        <div className="space-y-2 py-2">
          <h4 className="text-sm font-medium text-muted-foreground">Today&apos;s Meals</h4>
          {meals.map((meal) => {
            const mealName = meal.recipe?.title || meal.customMealName || 'Unnamed Meal';
            const emoji = getMealTypeEmoji(meal.mealType);
            const label = getMealTypeLabel(meal.mealType);

            return (
              <div
                key={meal.id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:border-primary/50 transition-colors"
              >
                <span className="text-2xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{mealName}</p>
                  <p className="text-xs text-muted-foreground">
                    {label}
                    {meal.isCompleted && ' • Completed ✓'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {meal.recipe && (
                      <DropdownMenuItem onClick={() => onViewRecipe?.(meal)}>
                        View Recipe
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEditMeal?.(meal)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteMeal?.(meal)}
                      className="text-destructive"
                    >
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>

        <Button onClick={onAddMeal} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Another Meal
        </Button>
      </div>
    );
  }

  // Featured meal exists - show hero card
  const mealName = featuredMeal!.recipe?.title || featuredMeal!.customMealName || 'Unnamed Meal';
  const mealImage = featuredMeal!.recipe?.imageUrl;
  const prepTime = featuredMeal!.recipe?.prepTime;
  const cookTime = (featuredMeal!.recipe as any)?.cookTime; // Note: cookTime might not be in Recipe type
  const emoji = getMealTypeEmoji(featuredMeal!.mealType);
  const label = getMealTypeLabel(featuredMeal!.mealType);
  const timesText = formatMealTimes(prepTime, cookTime);

  return (
    <div
      className="bg-gradient-to-br from-primary/5 to-transparent rounded-lg p-6 space-y-4 ring-2 ring-primary/20 min-h-[300px]"
      role="main"
      aria-label={`Today: ${format(date, 'EEEE MMMM d')}, Featured meal: ${mealName}`}
    >
      {/* Header */}
      <div className="space-y-1">
        <Badge className="bg-primary text-primary-foreground mb-2">TODAY</Badge>
        <h3 className="text-lg font-bold">
          {format(date, 'EEEE, MMMM d')}
        </h3>
        {weather && (
          <p className="text-sm text-muted-foreground">
            🌡️ {weather.temperature.current}° {weather.condition}
          </p>
        )}
      </div>

      {/* Featured Meal */}
      <div className="space-y-4">
        <div className="flex gap-4">
          {/* Recipe Image */}
          {mealImage && (
            <div className="flex-shrink-0">
              <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={mealImage}
                  alt={mealName}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Meal Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {emoji} {label}
              </p>
              <h4 className="text-xl font-semibold line-clamp-2">
                {mealName}
              </h4>
            </div>

            {/* Timing Info */}
            <div className="space-y-1 text-sm">
              {countdown.showCookingPrompt && !countdown.isPast && (
                <div
                  className="flex items-center gap-1.5 text-primary font-medium"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Start cooking in {countdown.text}</span>
                </div>
              )}

              {timesText && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ChefHat className="h-3.5 w-3.5" />
                  <span>{timesText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {countdown.showCookingPrompt && (
            <Button onClick={() => onStartCooking?.(featuredMeal!)}>
              <ChefHat className="h-4 w-4 mr-2" />
              Start Cooking
            </Button>
          )}

          {featuredMeal!.recipe && (
            <Button
              variant={countdown.showCookingPrompt ? 'outline' : 'default'}
              asChild
            >
              <Link href={`/recipes/${featuredMeal!.recipe.slug}`}>
                View Recipe
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditMeal?.(featuredMeal!)}>
                Edit Meal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteMeal?.(featuredMeal!)}>
                Remove from Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Other Meals for Today */}
      {otherMeals.length > 0 && (
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Also Today</h4>
          <div className="space-y-1">
            {otherMeals.map((meal) => {
              const name = meal.recipe?.title || meal.customMealName || 'Unnamed Meal';
              const mealEmoji = getMealTypeEmoji(meal.mealType);
              const mealLabel = getMealTypeLabel(meal.mealType);

              return (
                <div
                  key={meal.id}
                  className="text-sm flex items-center gap-2 text-muted-foreground"
                >
                  <span>{mealEmoji}</span>
                  <span>
                    {mealLabel}: {name}
                  </span>
                  {meal.isCompleted && <span className="text-xs">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
