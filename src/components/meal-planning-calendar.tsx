'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Download, Wand2 } from 'lucide-react';
import { MonthView } from './calendar/month-view';
import { WeekView } from './calendar/week-view';
import { DayView } from './calendar/day-view';
import { MealPlan, PlannedMeal, WeatherForecast } from '@/lib/types';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { useWeather } from '@/hooks/use-weather';
import { CreateMealPlanDialog } from './calendar/create-meal-plan-dialog';
import { GenerateMealPlanDialog } from './calendar/generate-meal-plan-dialog';
import { useQuery } from '@tanstack/react-query';

type CalendarView = 'month' | 'week' | 'day';

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

export function MealPlanningCalendar() {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const { activeMealPlan, mealPlans, isLoading } = useMealPlan();
  const { weatherForecast, isLoading: weatherLoading } = useWeather(
    activeMealPlan?.startDate,
    activeMealPlan?.endDate
  );
  
  // Fetch user's recipes
  const { data: recipes = [], isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: async () => {
      const res = await fetch('/api/recipes');
      if (!res.ok) throw new Error('Failed to fetch recipes');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Go to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format date header based on view
  const getDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = 
      view === 'month' 
        ? { month: 'long', year: 'numeric' }
        : view === 'week'
        ? { month: 'short', day: 'numeric', year: 'numeric' }
        : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading meal plan...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Meal Planning Calendar</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerateDialog(true)}
            disabled={!activeMealPlan}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-Generate
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!activeMealPlan}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={handleToday}
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="ml-4 text-lg font-semibold">
            {getDateHeader()}
          </div>
        </div>

        {/* View Switcher */}
        <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Active Meal Plan Info */}
      {activeMealPlan && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{activeMealPlan.name}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(activeMealPlan.startDate).toLocaleDateString()} - {new Date(activeMealPlan.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {activeMealPlan.meals?.length || 0} meals planned
            </div>
          </div>
        </div>
      )}

      {/* No Active Plan Message */}
      {!activeMealPlan && (
        <div className="rounded-lg border border-dashed bg-card p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Meal Plan</h3>
          <p className="text-muted-foreground mb-4">
            Create a new meal plan to start planning your meals with weather-based suggestions.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Meal Plan
          </Button>
        </div>
      )}

      {/* Calendar Views */}
      {activeMealPlan && (
        <div className="rounded-lg border bg-card">
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              mealPlan={activeMealPlan}
              weatherForecast={weatherForecast || []}
              recipes={recipes}
            />
          )}
          
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              mealPlan={activeMealPlan}
              weatherForecast={weatherForecast || []}
              recipes={recipes}
            />
          )}
          
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              mealPlan={activeMealPlan}
              weatherForecast={weatherForecast || []}
              recipes={recipes}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateMealPlanDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <GenerateMealPlanDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        mealPlan={activeMealPlan}
      />
    </div>
  );
}
