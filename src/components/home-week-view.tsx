'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { AddMealDialog } from '@/components/calendar/add-meal-dialog';
import { MealType, MealPlan as MealPlanType } from '@/lib/types';

interface PlannedMeal {
  id: string;
  date: Date;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipe?: {
    id: string;
    title: string;
    slug: string;
  };
  customMealName?: string;
  servings: number;
  notes?: string;
  recipeId?: string;
}

interface MealPlan {
  id: string;
  userId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  meals: PlannedMeal[];
  createdAt: Date;
  updatedAt: Date;
}

export function HomeWeekView() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('DINNER');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);

  useEffect(() => {
    fetchMealPlan();
    fetchRecipes();
  }, [currentWeekStart]);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/favorites');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const fetchMealPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meal-plans');
      if (response.ok) {
        const plans = await response.json();
        if (plans && plans.length > 0) {
          // Get the most recent meal plan
          const latestPlan = plans[0];
          // Convert date strings to Date objects
          const mealsWithDates = latestPlan.meals?.map((meal: any) => ({
            ...meal,
            date: new Date(meal.date)
          })) || [];
          setMealPlan({ ...latestPlan, meals: mealsWithDates });
        }
      }
    } catch (error) {
      console.error('Error fetching meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const today = new Date();

  const getMealsForDay = (date: Date) => {
    if (!mealPlan?.meals) return [];
    return mealPlan.meals.filter(meal => isSameDay(new Date(meal.date), date));
  };

  const previousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const nextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const handleDayClick = (date: Date, mealType?: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType || 'DINNER');
    setShowAddMeal(true);
  };

  const handleDialogClose = () => {
    setShowAddMeal(false);
    setSelectedDate(null);
    // Refresh meal plan after changes
    fetchMealPlan();
  };

  const getWeatherForDate = (date: Date) => {
    // Simple weather lookup - you can enhance this
    return weatherForecast.find(w => isSameDay(new Date(w.date), date)) || null;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-headline text-lg font-semibold text-foreground">This Week&apos;s Meals</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className="text-xs"
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 divide-x divide-border">
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, today);
          const meals = getMealsForDay(day);
          const dayMeals = {
            breakfast: meals.find(m => m.mealType === 'BREAKFAST'),
            lunch: meals.find(m => m.mealType === 'LUNCH'),
            dinner: meals.find(m => m.mealType === 'DINNER'),
            snack: meals.find(m => m.mealType === 'SNACK'),
          };

          return (
            <div
              key={index}
              className={`p-2 min-h-[120px] transition-colors bg-card ${
                isToday ? 'bg-accent border-2 border-primary' : ''
              }`}
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isToday ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-1">
                {dayMeals.breakfast && (
                  <div
                    onClick={() => handleDayClick(day, 'BREAKFAST')}
                    className="text-[10px] leading-tight bg-meal-breakfast-muted text-foreground p-1 rounded truncate cursor-pointer hover:bg-meal-breakfast/25 transition-colors"
                  >
                    🍳 {dayMeals.breakfast.recipe?.title || dayMeals.breakfast.customMealName}
                  </div>
                )}
                {dayMeals.lunch && (
                  <div
                    onClick={() => handleDayClick(day, 'LUNCH')}
                    className="text-[10px] leading-tight bg-meal-lunch-muted text-foreground p-1 rounded truncate cursor-pointer hover:bg-meal-lunch/25 transition-colors"
                  >
                    🥗 {dayMeals.lunch.recipe?.title || dayMeals.lunch.customMealName}
                  </div>
                )}
                {dayMeals.dinner && (
                  <div
                    onClick={() => handleDayClick(day, 'DINNER')}
                    className="text-[10px] leading-tight bg-meal-dinner-muted text-foreground p-1 rounded truncate cursor-pointer hover:bg-meal-dinner/25 transition-colors"
                  >
                    🍽️ {dayMeals.dinner.recipe?.title || dayMeals.dinner.customMealName}
                  </div>
                )}
                {dayMeals.snack && (
                  <div
                    onClick={() => handleDayClick(day, 'SNACK')}
                    className="text-[10px] leading-tight bg-meal-snack-muted text-foreground p-1 rounded truncate cursor-pointer hover:bg-meal-snack/25 transition-colors"
                  >
                    🍪 {dayMeals.snack.recipe?.title || dayMeals.snack.customMealName}
                  </div>
                )}
                {meals.length === 0 && (
                  <button
                    onClick={() => handleDayClick(day)}
                    className="w-full text-[10px] text-center text-muted-foreground py-2 hover:bg-accent rounded transition-colors group"
                  >
                    <Plus className="h-3 w-3 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/40 text-center">
        <Link href="/meal-plan">
          <Button variant="link" size="sm" className="text-xs">
            View Full Calendar →
          </Button>
        </Link>
      </div>

      {/* Add/Edit Meal Dialog */}
      {selectedDate && mealPlan && (
        <AddMealDialog
          open={showAddMeal}
          onOpenChange={handleDialogClose}
          date={selectedDate}
          mealPlan={mealPlan as MealPlanType}
          weather={getWeatherForDate(selectedDate)}
          defaultMealType={selectedMealType}
          recipes={recipes}
        />
      )}
    </Card>
  );
}
