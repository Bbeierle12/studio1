'use client';

import { PlannedMeal, WeatherForecast, MealPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Cloud, Sun, CloudRain, Snowflake, CloudLightning, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AddMealDialog } from './add-meal-dialog';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  course: string | null;
  cuisine: string | null;
  difficulty: string | null;
  prepTime: number | null;
  servings: number | null;
  tags: string;
  summary: string;
  imageUrl: string;
  ingredients: string;
}

interface DayCellProps {
  date: Date;
  meals: PlannedMeal[];
  weather: WeatherForecast | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  mealPlan: MealPlan;
  view: 'month' | 'week' | 'day';
  recipes?: Recipe[];
}

const weatherIcons: Record<string, any> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Snow: Snowflake,
  Thunderstorm: CloudLightning,
  Drizzle: CloudRain
};

const mealTypeColors = {
  BREAKFAST: 'bg-[#FFF9E6] border-[#D4A574] text-[#2D1F14]',
  LUNCH: 'bg-[#E8DCC4] border-[#C9A96E] text-[#2D1F14]',
  DINNER: 'bg-[#F4D9B0] border-[#D4A574] text-[#2D1F14]',
  SNACK: 'bg-[#FFE4B5] border-[#D2691E] text-[#2D1F14]'
};

export function DayCell({
  date,
  meals,
  weather,
  isCurrentMonth,
  isToday,
  mealPlan,
  view,
  recipes = []
}: DayCellProps) {
  const [showAddMeal, setShowAddMeal] = useState(false);
  
  const WeatherIcon = weather ? weatherIcons[weather.condition] || Cloud : Cloud;
  const dayNumber = date.getDate();
  
  // Limit meals shown in month view
  const displayedMeals = view === 'month' ? meals.slice(0, 2) : meals;
  const hiddenMealsCount = meals.length - displayedMeals.length;
  
  return (
    <>
      <div
        className={cn(
          'min-h-[120px] border border-[#2D1F14] rounded-lg p-2 transition-colors bg-[#4A3426] hover:bg-[#5C4033] cursor-pointer',
          !isCurrentMonth && 'opacity-40',
          isToday && 'ring-2 ring-[#D4A574]'
        )}
        onClick={() => setShowAddMeal(true)}
      >
        {/* Date header */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              'text-sm font-semibold text-[#F5E6D3]',
              isToday && 'bg-[#D4A574] text-[#2D1F14] rounded-full w-6 h-6 flex items-center justify-center'
            )}
          >
            {dayNumber}
          </span>
          
          {/* Weather indicator */}
          {weather && isCurrentMonth && (
            <div className="flex items-center gap-1">
              <WeatherIcon className="h-3 w-3 text-[#D4A574]" />
              <span className="text-xs text-[#D4A574]">
                {weather.temperature.high}°
              </span>
            </div>
          )}
        </div>
        
        {/* Meals */}
        <div className="space-y-1">
          {displayedMeals.map(meal => (
            <div
              key={meal.id}
              className={cn(
                'text-xs px-2 py-1 rounded border truncate',
                mealTypeColors[meal.mealType as keyof typeof mealTypeColors]
              )}
              title={meal.recipe?.title || meal.customMealName || 'Meal'}
            >
              {meal.recipe?.title || meal.customMealName}
            </div>
          ))}
          
          {hiddenMealsCount > 0 && (
            <div className="text-xs text-[#D4A574] pl-2">
              +{hiddenMealsCount} more
            </div>
          )}
        </div>
        
        {/* Add meal button (shows on hover in month view) */}
        {view === 'month' && isCurrentMonth && meals.length === 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMeal(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <AddMealDialog
        open={showAddMeal}
        onOpenChange={setShowAddMeal}
        date={date}
        mealPlan={mealPlan}
        weather={weather}
        recipes={recipes}
      />
    </>
  );
}
