'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

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
}

interface MealPlan {
  id: string;
  meals: PlannedMeal[];
}

export function HomeWeekView() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMealPlan();
  }, [currentWeekStart]);

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

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">📅 This Week&apos;s Meals</h3>
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
      <div className="grid grid-cols-7 divide-x">
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
              className={`p-2 min-h-[120px] ${
                isToday ? 'bg-orange-50 dark:bg-orange-950/20' : ''
              }`}
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isToday ? 'text-orange-600 dark:text-orange-400' : ''
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-1">
                {dayMeals.breakfast && (
                  <div className="text-[10px] leading-tight bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded truncate">
                    🍳 {dayMeals.breakfast.recipe?.title || dayMeals.breakfast.customMealName}
                  </div>
                )}
                {dayMeals.lunch && (
                  <div className="text-[10px] leading-tight bg-green-100 dark:bg-green-900/30 p-1 rounded truncate">
                    🥗 {dayMeals.lunch.recipe?.title || dayMeals.lunch.customMealName}
                  </div>
                )}
                {dayMeals.dinner && (
                  <div className="text-[10px] leading-tight bg-blue-100 dark:bg-blue-900/30 p-1 rounded truncate">
                    🍽️ {dayMeals.dinner.recipe?.title || dayMeals.dinner.customMealName}
                  </div>
                )}
                {dayMeals.snack && (
                  <div className="text-[10px] leading-tight bg-purple-100 dark:bg-purple-900/30 p-1 rounded truncate">
                    🍪 {dayMeals.snack.recipe?.title || dayMeals.snack.customMealName}
                  </div>
                )}
                {meals.length === 0 && (
                  <div className="text-[10px] text-center text-muted-foreground py-2">
                    No meals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-white/50 dark:bg-gray-900/50 text-center">
        <Link href="/meal-plan">
          <Button variant="link" size="sm" className="text-xs">
            View Full Calendar →
          </Button>
        </Link>
      </div>
    </Card>
  );
}
