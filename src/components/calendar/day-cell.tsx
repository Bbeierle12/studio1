'use client';

import { PlannedMeal, WeatherForecast, MealPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Cloud, Sun, CloudRain, Snowflake, CloudLightning, Thermometer, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { AddMealDialog } from './add-meal-dialog';
import { useMealPlan } from '@/hooks/use-meal-plan';

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
  activePlansOnDate?: MealPlan[];
  weather: WeatherForecast | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  mealPlan?: MealPlan;
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
  BREAKFAST: 'bg-meal-breakfast-muted border-meal-breakfast text-foreground',
  LUNCH: 'bg-meal-lunch-muted border-meal-lunch text-foreground',
  DINNER: 'bg-meal-dinner-muted border-meal-dinner text-foreground',
  SNACK: 'bg-meal-snack-muted border-meal-snack text-foreground'
};

export function DayCell({
  date,
  meals,
  activePlansOnDate = [],
  weather,
  isCurrentMonth,
  isToday,
  mealPlan,
  view,
  recipes = []
}: DayCellProps) {
  const [showAddMeal, setShowAddMeal] = useState(false);
  const { updateMealPlan } = useMealPlan();
  
  const WeatherIcon = weather ? weatherIcons[weather.condition] || Cloud : Cloud;
  const dayNumber = date.getDate();
  
  // Limit meals shown in month view
  const displayedMeals = view === 'month' ? meals.slice(0, 2) : meals;
  const hiddenMealsCount = meals.length - displayedMeals.length;
  
  const handleActivatePlan = (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    updateMealPlan({ id: planId, data: { isActive: true } });
  };
  
  return (
    <>
      <div
        className={cn(
          'min-h-[120px] border border-border rounded-lg p-2 transition-colors bg-card hover:bg-accent cursor-pointer flex flex-col',
          !isCurrentMonth && 'opacity-40',
          isToday && 'ring-2 ring-primary'
        )}
        onClick={() => {
          if (mealPlan) setShowAddMeal(true);
        }}
      >
        {/* Date header */}
        <div className="flex items-start justify-between mb-2">
          <span
            className={cn(
              'text-sm font-semibold text-foreground shrink-0',
              isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
            )}
          >
            {dayNumber}
          </span>
          
          {/* Weather indicator */}
          {weather && isCurrentMonth && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded-sm">
                <WeatherIcon className="h-3 w-3" />
                <span>{weather.temperature.high}°</span>
              </div>
              {weather.humidity !== undefined && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 px-1.5 rounded-sm">
                  <Droplets className="h-2.5 w-2.5 text-blue-400" />
                  <span>{weather.humidity}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-1 flex-1">
          {/* Meal Plan Markers */}
          {activePlansOnDate.map(plan => (
            <div
              key={`plan-${plan.id}`}
              onClick={(e) => handleActivatePlan(e, plan.id)}
              className={cn(
                'text-xs px-2 py-1 rounded border truncate cursor-pointer transition-colors',
                plan.isActive 
                  ? 'bg-primary text-primary-foreground border-primary font-medium'
                  : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
              )}
              title={`Click to enter plan mode: ${plan.name}`}
            >
              🗓️ {plan.name}
            </div>
          ))}

          {/* Meals */}
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
            <div className="text-xs text-muted-foreground pl-2">
              +{hiddenMealsCount} more
            </div>
          )}
        </div>
        
        {/* Add meal button (shows on hover in month view) */}
        {view === 'month' && isCurrentMonth && meals.length === 0 && mealPlan && (
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
      
      {mealPlan && (
        <AddMealDialog
          open={showAddMeal}
          onOpenChange={setShowAddMeal}
          date={date}
          mealPlan={mealPlan}
          weather={weather}
          recipes={recipes}
        />
      )}
    </>
  );
}
