'use client';

import { MealPlan, WeatherForecast, PlannedMeal, MealType } from '@/lib/types';
import { DayCell } from './day-cell';
import { getWeatherForDate } from '@/hooks/use-weather';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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

interface WeekViewProps {
  currentDate: Date;
  mealPlan: MealPlan;
  weatherForecast: WeatherForecast[];
  recipes?: Recipe[];
}

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export function WeekView({ currentDate, mealPlan, weatherForecast, recipes = [] }: WeekViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  
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
    if (!mealPlan.meals) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return mealPlan.meals.filter(meal => {
      const mealDateStr = new Date(meal.date).toISOString().split('T')[0];
      return mealDateStr === dateStr && meal.mealType === mealType;
    });
  };
  
  const handleAddMeal = (date: Date) => {
    setSelectedDate(date);
    setShowAddMeal(true);
  };
  
  return (
    <>
      <div className="p-4 bg-[#3D2B1F]">
        <div className="grid grid-cols-8 gap-2">
          {/* Meal type labels column */}
          <div className="flex flex-col">
            <div className="h-16" /> {/* Header spacer */}
            {MEAL_TYPES.map(type => (
              <div
                key={type}
                className="flex items-center justify-end h-24 pr-2 text-sm font-semibold text-[#D4A574]"
              >
                {type}
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {weekDays.map((date, dayIndex) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const weather = getWeatherForDate(weatherForecast, date);
            
            return (
              <div key={dayIndex} className="flex flex-col">
                {/* Day header */}
                <div className={`h-16 border border-[#2D1F14] rounded-lg p-2 mb-2 ${isToday ? 'bg-[#D4A574] text-[#2D1F14]' : 'bg-[#4A3426] text-[#F5E6D3]'}`}>
                  <div className="text-xs font-semibold">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {date.getDate()}
                  </div>
                  {weather && (
                    <div className="text-xs">
                      {weather.temperature.high}°/{weather.temperature.low}°
                    </div>
                  )}
                </div>
                
                {/* Meal slots */}
                {MEAL_TYPES.map(mealType => {
                  const meals = getMealsForSlot(date, mealType);
                  
                  return (
                    <div
                      key={mealType}
                      className="h-24 border border-[#2D1F14] rounded-lg p-2 mb-2 bg-[#4A3426] hover:bg-[#5C4033] transition-colors cursor-pointer"
                      onClick={() => handleAddMeal(date)}
                    >
                      {meals.length > 0 ? (
                        <div className="space-y-1">
                          {meals.map(meal => (
                            <div
                              key={meal.id}
                              className="text-xs font-medium truncate text-[#F5E6D3]"
                            >
                              {meal.recipe?.title || meal.customMealName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-full h-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMeal(date);
                          }}
                        >
                          <Plus className="h-4 w-4 text-[#D4A574]" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedDate && (
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
