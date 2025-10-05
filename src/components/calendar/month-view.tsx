'use client';

import { MealPlan, WeatherForecast, PlannedMeal } from '@/lib/types';
import { DayCell } from './day-cell';
import { getWeatherForDate } from '@/hooks/use-weather';

interface MonthViewProps {
  currentDate: Date;
  mealPlan: MealPlan;
  weatherForecast: WeatherForecast[];
}

export function MonthView({ currentDate, mealPlan, weatherForecast }: MonthViewProps) {
  // Get days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Previous month days to show
  const prevMonthLastDay = new Date(year, month, 0);
  const prevMonthDays = prevMonthLastDay.getDate();
  
  // Build calendar grid
  const calendarDays: Date[] = [];
  
  // Add previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push(new Date(year, month - 1, prevMonthDays - i));
  }
  
  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }
  
  // Add next month days to complete grid (6 rows of 7 days)
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push(new Date(year, month + 1, i));
  }
  
  // Get meals for each day
  const getMealsForDate = (date: Date): PlannedMeal[] => {
    if (!mealPlan.meals) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return mealPlan.meals.filter(meal => {
      const mealDateStr = new Date(meal.date).toISOString().split('T')[0];
      return mealDateStr === dateStr;
    });
  };
  
  return (
    <div className="p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday =
            date.toDateString() === new Date().toDateString();
          const meals = getMealsForDate(date);
          const weather = getWeatherForDate(weatherForecast, date);
          
          return (
            <DayCell
              key={index}
              date={date}
              meals={meals}
              weather={weather}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              mealPlan={mealPlan}
              view="month"
            />
          );
        })}
      </div>
    </div>
  );
}
