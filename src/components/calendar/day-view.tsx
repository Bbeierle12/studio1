'use client';

import { MealPlan, WeatherForecast, PlannedMeal, MealType } from '@/lib/types';
import { getWeatherForDate } from '@/hooks/use-weather';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Cloud, Thermometer, Droplets, Wind, Edit2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddMealDialog } from './add-meal-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { cn } from '@/lib/utils';

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

interface DayViewProps {
  currentDate: Date;
  mealPlan: MealPlan;
  weatherForecast: WeatherForecast[];
  recipes?: Recipe[];
}

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

const mealTypeColors = {
  BREAKFAST: 'border-yellow-400',
  LUNCH: 'border-green-400',
  DINNER: 'border-blue-400',
  SNACK: 'border-purple-400'
};

export function DayView({ currentDate, mealPlan, weatherForecast, recipes = [] }: DayViewProps) {
  const { deleteMeal, isDeleting } = useMealPlan();
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('DINNER');
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [mealToDelete, setMealToDelete] = useState<PlannedMeal | null>(null);
  
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
    setEditingMeal(null);
    setShowAddMeal(true);
  };
  
  const handleEditMeal = (meal: PlannedMeal) => {
    setEditingMeal(meal);
    setShowAddMeal(true);
  };
  
  const handleDeleteMeal = () => {
    if (mealToDelete) {
      deleteMeal({
        mealPlanId: mealPlan.id,
        mealId: mealToDelete.id
      });
      setMealToDelete(null);
    }
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
                        <div key={meal.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start gap-4">
                            {/* Recipe Image */}
                            {meal.recipe?.imageUrl && (
                              <img
                                src={meal.recipe.imageUrl}
                                alt={meal.recipe.title}
                                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            
                            {/* Meal Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-lg">
                                  {meal.recipe?.title || meal.customMealName}
                                </h4>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditMeal(meal)}
                                    title="Edit meal"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMealToDelete(meal)}
                                    title="Delete meal"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              
                              {meal.recipe && (
                                <div className="space-y-2 text-sm mt-2">
                                  <div className="flex items-center gap-4 text-muted-foreground">
                                    {meal.recipe.prepTime && (
                                      <span>⏱️ {meal.recipe.prepTime} min</span>
                                    )}
                                    <span>🍽️ {meal.servings} servings</span>
                                  </div>
                                  
                                  {meal.recipe.summary && (
                                    <p className="text-muted-foreground line-clamp-2">{meal.recipe.summary}</p>
                                  )}
                                </div>
                              )}
                              
                              {!meal.recipe && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  🍽️ {meal.servings} servings
                                </div>
                              )}
                              
                              {meal.notes && (
                                <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                  📝 {meal.notes}
                                </div>
                              )}
                            </div>
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
        existingMeal={editingMeal || undefined}
        recipes={recipes}
      />
      
      {/* Quick Delete Confirmation */}
      <AlertDialog open={!!mealToDelete} onOpenChange={(open) => !open && setMealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mealToDelete?.recipe?.title || mealToDelete?.customMealName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeal}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
