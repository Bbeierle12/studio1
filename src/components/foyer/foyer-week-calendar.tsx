'use client';

import { useEffect, useState } from 'react';
import { format, addDays, addWeeks, subWeeks, isSameWeek, startOfWeek } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlannedMeal, MealPlan as MealPlanType, MealType, WeatherForecast } from '@/lib/types';
import {
  getWeekBoundaries,
  getPastDays,
  getFutureDays,
  getFeaturedMeal,
  getMealsForDay,
  countMealsInRange
} from '@/lib/calendar-utils';
import { CompactDayCard } from './compact-day-card';
import { FeaturedTodayCard } from './featured-today-card';
import { AddMealDialog } from '@/components/calendar/add-meal-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export function FoyerWeekCalendar() {
  const router = useRouter();
  const [today] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);

  // Dialog state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('DINNER');
  const [showAddMeal, setShowAddMeal] = useState(false);

  // Calculate week boundaries
  const { weekStart, weekEnd } = getWeekBoundaries(currentDate);
  const isCurrentWeek = isSameWeek(currentDate, today, { weekStartsOn: 0 });
  const displayDate = isCurrentWeek ? today : currentDate;

  // Get day segments
  const pastDays = isCurrentWeek ? getPastDays(today, weekStart) : [];
  const futureDays = isCurrentWeek ? getFutureDays(today, weekEnd) : getFutureDays(currentDate, weekEnd);

  // Get meals
  const allMeals = mealPlan?.meals || [];
  const todayMeals = getMealsForDay(displayDate, allMeals);
  const featuredMeal = getFeaturedMeal(todayMeals);

  // Count meals for mobile accordion labels
  const pastMealCount = countMealsInRange(pastDays, allMeals);
  const futureMealCount = countMealsInRange(futureDays, allMeals);

  // Fetch data
  useEffect(() => {
    fetchMealPlan();
    fetchRecipes();
    fetchWeather();
  }, [currentDate]);

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
          const latestPlan = plans[0];
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

  const fetchWeather = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async () => {
            // Mock weather for now (matches WeatherForecast type)
            const mockWeather: WeatherForecast = {
              date: new Date(),
              temperature: {
                high: 75,
                low: 68,
                current: 72
              },
              condition: 'Sunny',
              precipitation: 0,
              humidity: 45,
              windSpeed: 5,
              icon: '01d'
            };
            setWeather(mockWeather);
          },
          () => {
            setWeather({
              date: new Date(),
              temperature: {
                high: 73,
                low: 65,
                current: 70
              },
              condition: 'Clear',
              precipitation: 0,
              humidity: 50,
              windSpeed: 3,
              icon: '01d'
            });
          }
        );
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    }
  };

  // Navigation
  const previousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Dialog handlers
  const handleDayClick = (date: Date, mealType?: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType || 'DINNER');
    setShowAddMeal(true);
  };

  const handleDialogClose = () => {
    setShowAddMeal(false);
    setSelectedDate(null);
    fetchMealPlan();
  };

  const handleStartCooking = (meal: PlannedMeal) => {
    if (meal.recipe) {
      router.push(`/recipes/${meal.recipe.slug}?cooking=true`);
    }
  };

  const handleViewRecipe = (meal: PlannedMeal) => {
    if (meal.recipe) {
      router.push(`/recipes/${meal.recipe.slug}`);
    }
  };

  const handleEditMeal = (meal: PlannedMeal) => {
    setSelectedDate(new Date(meal.date));
    setSelectedMealType(meal.mealType);
    setShowAddMeal(true);
  };

  const handleDeleteMeal = async (meal: PlannedMeal) => {
    if (!confirm('Remove this meal from your plan?')) return;

    try {
      const response = await fetch(
        `/api/meal-plans/${meal.mealPlanId}/meals?mealId=${meal.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchMealPlan();
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="bg-[#3D2B1F]/90 backdrop-blur-sm p-6 border-[#2D1F14]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-[#3D2B1F]/90 dark:bg-[#3D2B1F]/90 backdrop-blur-sm overflow-hidden border-[#2D1F14]">
        {/* Header */}
        <div className="p-4 border-b border-[#2D1F14] bg-[#4A3426]/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#F5E6D3]">
              📅 This Week&apos;s Meals
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={previousWeek}
                className="text-[#D4A574] hover:text-[#F5E6D3]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                disabled={isCurrentWeek}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextWeek}
                className="text-[#D4A574] hover:text-[#F5E6D3]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-[#D4A574]">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>

        {/* Desktop/Tablet Layout: Three Segments */}
        <div className="hidden md:block p-4">
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4"
            role="region"
            aria-label="Weekly meal calendar"
          >
            {/* Past Days Segment */}
            <div className="space-y-3" role="group" aria-label="Past days">
              {pastDays.length > 0 ? (
                <>
                  <h4 className="text-xs font-semibold text-[#D4A574] uppercase tracking-wide">
                    Past {pastDays.length} Days
                  </h4>
                  {pastDays.map((date) => (
                    <CompactDayCard
                      key={date.toISOString()}
                      date={date}
                      meals={getMealsForDay(date, allMeals)}
                      isPast={true}
                      onClick={() => handleDayClick(date)}
                    />
                  ))}
                </>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-8">
                  Start of week
                </div>
              )}
            </div>

            {/* Today Segment */}
            <div>
              <FeaturedTodayCard
                date={displayDate}
                meals={todayMeals}
                featuredMeal={featuredMeal}
                weather={weather}
                onStartCooking={handleStartCooking}
                onViewRecipe={handleViewRecipe}
                onEditMeal={handleEditMeal}
                onDeleteMeal={handleDeleteMeal}
                onAddMeal={() => handleDayClick(displayDate)}
              />
            </div>

            {/* Future Days Segment */}
            <div className="space-y-3" role="group" aria-label="Future days">
              {futureDays.length > 0 ? (
                <>
                  <h4 className="text-xs font-semibold text-[#D4A574] uppercase tracking-wide">
                    Next {futureDays.length} Days
                  </h4>
                  {futureDays.map((date) => (
                    <CompactDayCard
                      key={date.toISOString()}
                      date={date}
                      meals={getMealsForDay(date, allMeals)}
                      isPast={false}
                      onClick={() => handleDayClick(date)}
                      onAddMeal={() => handleDayClick(date)}
                    />
                  ))}
                </>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-8">
                  End of week
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout: Accordion */}
        <div className="block md:hidden p-4">
          <Accordion type="multiple" defaultValue={['today']} className="space-y-2">
            {/* Past Days Accordion */}
            {pastDays.length > 0 && (
              <AccordionItem value="past" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm">
                    <span>← Past {pastDays.length} Days</span>
                    <span className="text-xs text-muted-foreground">
                      ({pastMealCount} {pastMealCount === 1 ? 'meal' : 'meals'})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-2">
                  {pastDays.map((date) => (
                    <CompactDayCard
                      key={date.toISOString()}
                      date={date}
                      meals={getMealsForDay(date, allMeals)}
                      isPast={true}
                      onClick={() => handleDayClick(date)}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Today Section - Always Expanded */}
            <AccordionItem value="today" className="border-2 border-primary/20 rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline font-bold">
                <div className="text-sm">
                  TODAY • {format(displayDate, 'EEEE, MMM d')}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <FeaturedTodayCard
                  date={displayDate}
                  meals={todayMeals}
                  featuredMeal={featuredMeal}
                  weather={weather}
                  onStartCooking={handleStartCooking}
                  onViewRecipe={handleViewRecipe}
                  onEditMeal={handleEditMeal}
                  onDeleteMeal={handleDeleteMeal}
                  onAddMeal={() => handleDayClick(displayDate)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Future Days Accordion */}
            {futureDays.length > 0 && (
              <AccordionItem value="future" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Next {futureDays.length} Days →</span>
                    <span className="text-xs text-muted-foreground">
                      ({futureMealCount} {futureMealCount === 1 ? 'meal' : 'meals'})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-2">
                  {futureDays.map((date) => (
                    <CompactDayCard
                      key={date.toISOString()}
                      date={date}
                      meals={getMealsForDay(date, allMeals)}
                      isPast={false}
                      onClick={() => handleDayClick(date)}
                      onAddMeal={() => handleDayClick(date)}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2D1F14] bg-[#4A3426]/50 text-center">
          <Link href="/meal-plan">
            <Button variant="link" size="sm" className="text-xs text-[#D4A574] hover:text-[#F5E6D3]">
              View Full Calendar →
            </Button>
          </Link>
        </div>
      </Card>

      {/* Add/Edit Meal Dialog */}
      {selectedDate && mealPlan && (
        <AddMealDialog
          open={showAddMeal}
          onOpenChange={handleDialogClose}
          date={selectedDate}
          mealPlan={mealPlan as MealPlanType}
          weather={weather}
          defaultMealType={selectedMealType}
          recipes={recipes}
        />
      )}
    </>
  );
}
