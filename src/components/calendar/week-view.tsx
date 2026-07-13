'use client';

import { MealPlan, WeatherForecast, PlannedMeal, MealType } from '@/lib/types';
import { DayCell } from './day-cell';
import { getWeatherForDate } from '@/hooks/use-weather';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AddMealDialog } from './add-meal-dialog';
import { cn } from '@/lib/utils';
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

interface WeekViewProps {
  currentDate: Date;
  mealPlan?: MealPlan;
  mealPlans: MealPlan[];
  weatherForecast: WeatherForecast[];
  recipes?: Recipe[];
}

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export function WeekView({ currentDate, mealPlan, mealPlans, weatherForecast, recipes = [] }: WeekViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const { updateMealPlan } = useMealPlan();
  
  // Get start of week (Sunday)
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  
  // Build week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return date;
  });
  
  // Get meals for a specific date and meal type
  const getMealsForSlot = (date: Date, mealType: MealType): PlannedMeal[] => {
    if (!mealPlan?.meals) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return mealPlan.meals.filter(meal => {
      const mealDateStr = new Date(meal.date).toISOString().split('T')[0];
      return mealDateStr === dateStr && meal.mealType === mealType;
    });
  };

  // Get meal plans that overlap with this date
  const getPlansForDate = (date: Date): MealPlan[] => {
    const dateStr = date.toISOString().split('T')[0];
    const dateMs = new Date(dateStr).getTime();
    
    return mealPlans.filter(plan => {
      const planStart = new Date(new Date(plan.startDate).toISOString().split('T')[0]).getTime();
      const planEnd = new Date(new Date(plan.endDate).toISOString().split('T')[0]).getTime();
      return dateMs >= planStart && dateMs <= planEnd;
    });
  };
  
  const handleAddMeal = (date: Date) => {
    setSelectedDate(date);
    setShowAddMeal(true);
  };
  
  return (
    <>
      <div className="p-4 bg-background overflow-x-auto">
        <div className="grid grid-cols-8 gap-2 min-w-[800px]">
          {/* Meal type labels column */}
          <div className="flex flex-col">
            <div className="h-28" /> {/* Header spacer */}
            {MEAL_TYPES.map(type => (
              <div
                key={type}
                className="flex items-center justify-end h-24 pr-2 text-sm font-semibold text-muted-foreground"
              >
                {type}
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {weekDays.map((date, dayIndex) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const weather = getWeatherForDate(weatherForecast, date);
            const activePlans = getPlansForDate(date);
            
            return (
              <div key={dayIndex} className="flex flex-col">
                {/* Day header */}
                <div className={`h-28 border border-border rounded-lg p-2 mb-2 flex flex-col ${isToday ? 'bg-primary/10 border-primary' : 'bg-card text-foreground'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-semibold">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={cn("text-lg font-bold", isToday && 'text-primary')}>
                        {date.getDate()}
                      </div>
                    </div>
                    {weather && (
                      <div className="flex flex-col items-end text-xs text-muted-foreground">
                        <div>{weather.temperature.high}°/{weather.temperature.low}°</div>
                        {weather.humidity !== undefined && (
                          <div className="text-[10px]">💧 {weather.humidity}%</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Meal Plan Markers in Header */}
                  <div className="flex-1 mt-1 overflow-y-auto space-y-1 scrollbar-hide">
                    {activePlans.map(plan => (
                      <div
                        key={`plan-${plan.id}`}
                        onClick={() => updateMealPlan({ id: plan.id, data: { isActive: true } })}
                        className={cn(
                          'text-[10px] px-1 py-0.5 rounded border truncate cursor-pointer transition-colors',
                          plan.isActive 
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                        )}
                        title={`Click to enter plan mode: ${plan.name}`}
                      >
                        {plan.name}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Meal slots */}
                {MEAL_TYPES.map(mealType => {
                  const meals = getMealsForSlot(date, mealType);
                  
                  return (
                    <div
                      key={mealType}
                      className={cn(
                        'h-24 border border-border rounded-lg p-2 mb-2 bg-card',
                        mealPlan && 'hover:bg-accent transition-colors cursor-pointer'
                      )}
                      onClick={mealPlan ? () => handleAddMeal(date) : undefined}
                    >
                      {meals.length > 0 ? (
                        <div className="space-y-1">
                          {meals.map(meal => (
                            <div
                              key={meal.id}
                              className="text-xs font-medium truncate text-foreground"
                            >
                              {meal.recipe?.title || meal.customMealName}
                            </div>
                          ))}
                        </div>
                      ) : mealPlan ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-full h-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMeal(date);
                          }}
                        >
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedDate && mealPlan && (
        <AddMealDialog
          open={showAddMeal}
          onOpenChange={setShowAddMeal}
          date={selectedDate}
          mealPlan={mealPlan}
          weather={getWeatherForDate(weatherForecast, selectedDate)}
          recipes={recipes}
        />
      )}
    </>
  );
}
