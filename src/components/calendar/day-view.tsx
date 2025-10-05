'use client';

import { MealPlan, WeatherForecast, PlannedMeal, MealType } from '@/lib/types';
import { getWeatherForDate } from '@/hooks/use-weather';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Cloud, Sun, CloudRain, Thermometer, Droplets, Wind } from 'lucide-react';
import { useState } from 'react';
import { AddMealDialog } from './add-meal-dialog';
import { cn } from '@/lib/utils';

interface DayViewProps {
  currentDate: Date;
  mealPlan: MealPlan;
  weatherForecast: WeatherForecast[];
}

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

const mealTypeColors = {
  BREAKFAST: 'border-yellow-400',
  LUNCH: 'border-green-400',
  DINNER: 'border-blue-400',
  SNACK: 'border-purple-400'
};

export function DayView({ currentDate, mealPlan, weatherForecast }: DayViewProps) {
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('DINNER');
  
  const weather = getWeatherForDate(weatherForecast, currentDate);
  
  // Get meals for this day
  const getMealsForType = (mealType: MealType): PlannedMeal[] => {
    if (!mealPlan.meals) return [];
    
    const dateStr = currentDate.toISOString().split('T')[0];
    return mealPlan.meals.filter(meal => {
      const mealDateStr = new Date(meal.date).toISOString().split('T')[0];
      return mealDateStr === dateStr && meal.mealType === mealType;
    });
  };
  
  const handleAddMeal = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowAddMeal(true);
  };
  
  return (
    <>
      <div className="p-6 space-y-6">
        {/* Weather Card */}
        {weather && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Weather Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                    <div className="text-lg font-semibold">
                      {weather.temperature.high}° / {weather.temperature.low}°
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Condition</div>
                    <div className="text-lg font-semibold">{weather.condition}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Precipitation</div>
                    <div className="text-lg font-semibold">{weather.precipitation}%</div>
                  </div>
                </div>
                
                {weather.windSpeed && (
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Wind</div>
                      <div className="text-lg font-semibold">{weather.windSpeed} mph</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Meals */}
        <div className="space-y-4">
          {MEAL_TYPES.map(mealType => {
            const meals = getMealsForType(mealType);
            
            return (
              <Card key={mealType} className={cn('border-l-4', mealTypeColors[mealType])}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{mealType}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMeal(mealType)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Meal
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {meals.length > 0 ? (
                    <div className="space-y-4">
                      {meals.map(meal => (
                        <div key={meal.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">
                                {meal.recipe?.title || meal.customMealName}
                              </h4>
                              
                              {meal.recipe && (
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-4 text-muted-foreground">
                                    {meal.recipe.prepTime && (
                                      <span>⏱️ {meal.recipe.prepTime} min</span>
                                    )}
                                    <span>🍽️ {meal.servings} servings</span>
                                  </div>
                                  
                                  {meal.recipe.summary && (
                                    <p className="text-muted-foreground">{meal.recipe.summary}</p>
                                  )}
                                </div>
                              )}
                              
                              {meal.notes && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  📝 {meal.notes}
                                </div>
                              )}
                            </div>
                            
                            {meal.recipe?.imageUrl && (
                              <img
                                src={meal.recipe.imageUrl}
                                alt={meal.recipe.title}
                                className="w-24 h-24 object-cover rounded-lg ml-4"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No meal planned for {mealType.toLowerCase()}</p>
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => handleAddMeal(mealType)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add a meal
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      <AddMealDialog
        open={showAddMeal}
        onOpenChange={setShowAddMeal}
        date={currentDate}
        mealPlan={mealPlan}
        weather={weather}
        defaultMealType={selectedMealType}
      />
    </>
  );
}
