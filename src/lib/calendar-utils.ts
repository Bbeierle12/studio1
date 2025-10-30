import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subDays,
  addDays,
  isSameDay,
  differenceInMilliseconds,
  differenceInMinutes,
  differenceInHours
} from 'date-fns';
import { PlannedMeal, MealType } from './types';

/**
 * Get the past 3 days before today within the current week
 */
export function getPastDays(today: Date, weekStart: Date): Date[] {
  const pastDays = eachDayOfInterval({
    start: weekStart,
    end: subDays(today, 1)
  });

  // Return last 3 days (or fewer if at start of week)
  return pastDays.slice(-3);
}

/**
 * Get the next 3 days after today within the current week
 */
export function getFutureDays(today: Date, weekEnd: Date): Date[] {
  const futureDays = eachDayOfInterval({
    start: addDays(today, 1),
    end: weekEnd
  });

  // Return first 3 days (or fewer if at end of week)
  return futureDays.slice(0, 3);
}

/**
 * Calculate week boundaries
 */
export function getWeekBoundaries(date: Date): { weekStart: Date; weekEnd: Date } {
  return {
    weekStart: startOfWeek(date, { weekStartsOn: 0 }), // Sunday
    weekEnd: endOfWeek(date, { weekStartsOn: 0 })      // Saturday
  };
}

/**
 * Get the featured meal for today based on time of day
 * Priority: Next upcoming meal > First meal if all past > null
 */
export function getFeaturedMeal(todayMeals: PlannedMeal[]): PlannedMeal | null {
  if (!todayMeals || todayMeals.length === 0) return null;

  const now = new Date();
  const currentHour = now.getHours();

  // Helper to find a meal by type
  const findMeal = (type: MealType) =>
    todayMeals.find(m => m.mealType === type);

  // Morning (5am-11am): Feature breakfast or lunch
  if (currentHour >= 5 && currentHour < 11) {
    return findMeal('BREAKFAST') || findMeal('LUNCH') || findMeal('DINNER') || todayMeals[0];
  }

  // Afternoon (11am-4pm): Feature lunch or dinner
  if (currentHour >= 11 && currentHour < 16) {
    return findMeal('LUNCH') || findMeal('DINNER') || todayMeals[0];
  }

  // Evening (4pm-midnight): Feature dinner
  if (currentHour >= 16 && currentHour < 24) {
    return findMeal('DINNER') || todayMeals[0];
  }

  // Late night (midnight-5am): Feature tomorrow's breakfast or first meal
  return todayMeals[0] || null;
}

/**
 * Get other meals for today (non-featured meals)
 */
export function getOtherMeals(todayMeals: PlannedMeal[], featuredMeal: PlannedMeal | null): PlannedMeal[] {
  if (!featuredMeal) return todayMeals;
  return todayMeals.filter(m => m.id !== featuredMeal.id);
}

/**
 * Calculate time until a scheduled meal
 */
export function getTimeUntilMeal(scheduledTime?: string | null): {
  text: string;
  isPast: boolean;
  showCookingPrompt: boolean;
  minutes: number;
} {
  if (!scheduledTime) {
    return {
      text: '',
      isPast: false,
      showCookingPrompt: false,
      minutes: 0
    };
  }

  const now = new Date();
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const mealTime = new Date();
  mealTime.setHours(hours, minutes, 0, 0);

  const diffMs = differenceInMilliseconds(mealTime, now);
  const diffMin = differenceInMinutes(mealTime, now);
  const diffHours = differenceInHours(mealTime, now);

  if (diffMs < 0) {
    return {
      text: 'Past meal time',
      isPast: true,
      showCookingPrompt: false,
      minutes: diffMin
    };
  }

  // Show "Start cooking" prompt 2 hours before
  const showCookingPrompt = diffMs < 7200000 && diffMs > 0; // 2 hours in ms

  let text = '';
  if (diffMin < 60) {
    text = `${diffMin}min`;
  } else {
    const remainingMin = diffMin % 60;
    text = remainingMin > 0
      ? `${diffHours}h ${remainingMin}min`
      : `${diffHours}h`;
  }

  return {
    text: text,
    isPast: false,
    showCookingPrompt,
    minutes: diffMin
  };
}

/**
 * Format meal prep and cook times
 */
export function formatMealTimes(prepTime?: number, cookTime?: number): string {
  const parts: string[] = [];

  if (prepTime) {
    parts.push(`${prepTime}min prep`);
  }

  if (cookTime) {
    parts.push(`${cookTime}min cook`);
  }

  return parts.join(' • ') || '';
}

/**
 * Get time of day greeting
 */
export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Get meal type emoji
 */
export function getMealTypeEmoji(mealType: MealType): string {
  const emojiMap: Record<MealType, string> = {
    BREAKFAST: '🍳',
    LUNCH: '🥗',
    DINNER: '🍽️',
    SNACK: '🍪'
  };

  return emojiMap[mealType] || '🍽️';
}

/**
 * Get meal type label
 */
export function getMealTypeLabel(mealType: MealType): string {
  const labelMap: Record<MealType, string> = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner',
    SNACK: 'Snack'
  };

  return labelMap[mealType] || mealType;
}

/**
 * Check if meals exist for a specific day
 */
export function hasMealsForDay(date: Date, allMeals: PlannedMeal[]): boolean {
  return allMeals.some(meal => isSameDay(new Date(meal.date), date));
}

/**
 * Get meals for a specific day
 */
export function getMealsForDay(date: Date, allMeals: PlannedMeal[]): PlannedMeal[] {
  return allMeals.filter(meal => isSameDay(new Date(meal.date), date));
}

/**
 * Count meals for a date range
 */
export function countMealsInRange(dates: Date[], allMeals: PlannedMeal[]): number {
  return dates.reduce((count, date) => {
    const dayMeals = getMealsForDay(date, allMeals);
    return count + dayMeals.length;
  }, 0);
}
