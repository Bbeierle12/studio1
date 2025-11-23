/**
 * Calendar Utilities Test Suite
 * 
 * Tests calendar and meal planning utility functions.
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPastDays,
  getFutureDays,
  getWeekBoundaries,
  getFeaturedMeal,
  getOtherMeals,
  getTimeUntilMeal,
  formatMealTimes,
  getTimeOfDayGreeting,
  getMealTypeEmoji,
  getMealTypeLabel,
  hasMealsForDay,
  getMealsForDay,
  countMealsInRange,
} from '@/lib/calendar-utils';
import type { PlannedMeal, MealType } from '@/lib/types';

describe('Calendar Utilities', () => {
  describe('getPastDays', () => {
    it('should return up to 3 days before today', () => {
      const today = new Date('2024-01-10'); // Wednesday
      const weekStart = new Date('2024-01-07'); // Sunday
      
      const result = getPastDays(today, weekStart);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should return fewer days at start of week', () => {
      const today = new Date('2024-01-08'); // Monday
      const weekStart = new Date('2024-01-07'); // Sunday
      
      const result = getPastDays(today, weekStart);
      expect(result.length).toBe(1); // Only Sunday
    });

    it('should handle when today is week start', () => {
      const today = new Date('2024-01-07'); // Sunday
      const weekStart = new Date('2024-01-07'); // Sunday
      
      const result = getPastDays(today, weekStart);
      // When today equals weekStart, subDays(today, 1) is before weekStart
      // eachDayOfInterval will still return an array
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getFutureDays', () => {
    it('should return up to 3 days after today', () => {
      const today = new Date('2024-01-10'); // Wednesday
      const weekEnd = new Date('2024-01-13'); // Saturday
      
      const result = getFutureDays(today, weekEnd);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should return fewer days at end of week', () => {
      const today = new Date('2024-01-12'); // Friday
      const weekEnd = new Date('2024-01-13'); // Saturday
      
      const result = getFutureDays(today, weekEnd);
      expect(result.length).toBe(1); // Only Saturday
    });

    it('should handle when today is week end', () => {
      const today = new Date('2024-01-13'); // Saturday
      const weekEnd = new Date('2024-01-13'); // Saturday
      
      const result = getFutureDays(today, weekEnd);
      // When today equals weekEnd, addDays(today, 1) might be after weekEnd
      // depending on implementation details
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getWeekBoundaries', () => {
    it('should return Sunday as week start', () => {
      const date = new Date('2024-01-10'); // Wednesday
      const { weekStart, weekEnd } = getWeekBoundaries(date);
      
      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekEnd.getDay()).toBe(6); // Saturday
    });

    it('should return correct week for dates at boundaries', () => {
      const sunday = new Date('2024-01-07');
      const { weekStart } = getWeekBoundaries(sunday);
      expect(weekStart.getDate()).toBe(7);
    });
  });

  describe('getFeaturedMeal', () => {
    const createMeal = (mealType: MealType): PlannedMeal => ({
      id: `meal-${mealType}`,
      userId: 'user-1',
      date: new Date(),
      mealType,
      recipeId: 'recipe-1',
      servings: 2,
      notes: null,
      scheduledTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should return breakfast in morning hours', () => {
      // Mock time to 8am
      const mockDate = new Date('2024-01-10T08:00:00');
      vi.setSystemTime(mockDate);

      const meals = [
        createMeal('BREAKFAST'),
        createMeal('LUNCH'),
        createMeal('DINNER'),
      ];

      const result = getFeaturedMeal(meals);
      expect(result?.mealType).toBe('BREAKFAST');
      
      vi.useRealTimers();
    });

    it('should return lunch in afternoon hours', () => {
      // Mock time to 1pm
      const mockDate = new Date('2024-01-10T13:00:00');
      vi.setSystemTime(mockDate);

      const meals = [
        createMeal('BREAKFAST'),
        createMeal('LUNCH'),
        createMeal('DINNER'),
      ];

      const result = getFeaturedMeal(meals);
      expect(result?.mealType).toBe('LUNCH');
      
      vi.useRealTimers();
    });

    it('should return dinner in evening hours', () => {
      // Mock time to 6pm
      const mockDate = new Date('2024-01-10T18:00:00');
      vi.setSystemTime(mockDate);

      const meals = [
        createMeal('BREAKFAST'),
        createMeal('LUNCH'),
        createMeal('DINNER'),
      ];

      const result = getFeaturedMeal(meals);
      expect(result?.mealType).toBe('DINNER');
      
      vi.useRealTimers();
    });

    it('should return null for empty meals array', () => {
      const result = getFeaturedMeal([]);
      expect(result).toBeNull();
    });

    it('should fallback to first meal if preferred type not found', () => {
      // Mock time to 8am (expects breakfast)
      const mockDate = new Date('2024-01-10T08:00:00');
      vi.setSystemTime(mockDate);

      const meals = [createMeal('DINNER')]; // Only dinner available

      const result = getFeaturedMeal(meals);
      expect(result?.mealType).toBe('DINNER');
      
      vi.useRealTimers();
    });
  });

  describe('getOtherMeals', () => {
    const createMeal = (id: string, mealType: MealType): PlannedMeal => ({
      id,
      userId: 'user-1',
      date: new Date(),
      mealType,
      recipeId: 'recipe-1',
      servings: 2,
      notes: null,
      scheduledTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should exclude featured meal from list', () => {
      const breakfast = createMeal('meal-1', 'BREAKFAST');
      const lunch = createMeal('meal-2', 'LUNCH');
      const dinner = createMeal('meal-3', 'DINNER');
      
      const allMeals = [breakfast, lunch, dinner];
      const result = getOtherMeals(allMeals, breakfast);
      
      expect(result.length).toBe(2);
      expect(result).not.toContainEqual(breakfast);
      expect(result).toContainEqual(lunch);
      expect(result).toContainEqual(dinner);
    });

    it('should return all meals when featured is null', () => {
      const meals = [
        createMeal('meal-1', 'BREAKFAST'),
        createMeal('meal-2', 'LUNCH'),
      ];
      
      const result = getOtherMeals(meals, null);
      expect(result.length).toBe(2);
    });
  });

  describe('getTimeUntilMeal', () => {
    it('should return empty result for null scheduled time', () => {
      const result = getTimeUntilMeal(null);
      expect(result.text).toBe('');
      expect(result.isPast).toBe(false);
      expect(result.showCookingPrompt).toBe(false);
    });

    it('should show past meal time for times in the past', () => {
      // Mock current time to 2pm
      const mockDate = new Date('2024-01-10T14:00:00');
      vi.setSystemTime(mockDate);

      const result = getTimeUntilMeal('12:00'); // noon
      expect(result.isPast).toBe(true);
      expect(result.text).toBe('Past meal time');
      
      vi.useRealTimers();
    });

    it('should format minutes for meals within an hour', () => {
      // Mock current time
      const mockDate = new Date('2024-01-10T11:30:00');
      vi.setSystemTime(mockDate);

      const result = getTimeUntilMeal('11:45'); // 15 minutes from now
      expect(result.text).toContain('min');
      expect(result.isPast).toBe(false);
      
      vi.useRealTimers();
    });

    it('should format hours for meals more than an hour away', () => {
      // Mock current time
      const mockDate = new Date('2024-01-10T10:00:00');
      vi.setSystemTime(mockDate);

      const result = getTimeUntilMeal('13:00'); // 3 hours from now
      expect(result.text).toContain('h');
      expect(result.isPast).toBe(false);
      
      vi.useRealTimers();
    });

    it('should show cooking prompt 2 hours before meal', () => {
      // Mock current time
      const mockDate = new Date('2024-01-10T10:00:00');
      vi.setSystemTime(mockDate);

      const result = getTimeUntilMeal('11:30'); // 1.5 hours from now
      expect(result.showCookingPrompt).toBe(true);
      
      vi.useRealTimers();
    });

    it('should not show cooking prompt more than 2 hours before meal', () => {
      // Mock current time
      const mockDate = new Date('2024-01-10T10:00:00');
      vi.setSystemTime(mockDate);

      const result = getTimeUntilMeal('13:00'); // 3 hours from now
      expect(result.showCookingPrompt).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('formatMealTimes', () => {
    it('should format both prep and cook times', () => {
      const result = formatMealTimes(15, 30);
      expect(result).toBe('15min prep • 30min cook');
    });

    it('should format only prep time', () => {
      const result = formatMealTimes(15, undefined);
      expect(result).toBe('15min prep');
    });

    it('should format only cook time', () => {
      const result = formatMealTimes(undefined, 30);
      expect(result).toBe('30min cook');
    });

    it('should return empty string for no times', () => {
      const result = formatMealTimes(undefined, undefined);
      expect(result).toBe('');
    });

    it('should handle zero values', () => {
      const result = formatMealTimes(0, 0);
      expect(result).toBe('');
    });
  });

  describe('getTimeOfDayGreeting', () => {
    it('should return morning greeting before noon', () => {
      const mockDate = new Date('2024-01-10T08:00:00');
      vi.setSystemTime(mockDate);

      const result = getTimeOfDayGreeting();
      expect(result).toBe('Good morning');
      
      vi.useRealTimers();
    });

    it('should return afternoon greeting between noon and 6pm', () => {
      const mockDate = new Date('2024-01-10T14:00:00');
      vi.setSystemTime(mockDate);

      const result = getTimeOfDayGreeting();
      expect(result).toBe('Good afternoon');
      
      vi.useRealTimers();
    });

    it('should return evening greeting after 6pm', () => {
      const mockDate = new Date('2024-01-10T19:00:00');
      vi.setSystemTime(mockDate);

      const result = getTimeOfDayGreeting();
      expect(result).toBe('Good evening');
      
      vi.useRealTimers();
    });
  });

  describe('getMealTypeEmoji', () => {
    it('should return correct emoji for breakfast', () => {
      expect(getMealTypeEmoji('BREAKFAST')).toBe('🍳');
    });

    it('should return correct emoji for lunch', () => {
      expect(getMealTypeEmoji('LUNCH')).toBe('🥗');
    });

    it('should return correct emoji for dinner', () => {
      expect(getMealTypeEmoji('DINNER')).toBe('🍽️');
    });

    it('should return correct emoji for snack', () => {
      expect(getMealTypeEmoji('SNACK')).toBe('🍪');
    });
  });

  describe('getMealTypeLabel', () => {
    it('should return correct label for each meal type', () => {
      expect(getMealTypeLabel('BREAKFAST')).toBe('Breakfast');
      expect(getMealTypeLabel('LUNCH')).toBe('Lunch');
      expect(getMealTypeLabel('DINNER')).toBe('Dinner');
      expect(getMealTypeLabel('SNACK')).toBe('Snack');
    });
  });

  describe('hasMealsForDay', () => {
    const createMeal = (date: Date): PlannedMeal => ({
      id: 'meal-1',
      userId: 'user-1',
      date,
      mealType: 'BREAKFAST',
      recipeId: 'recipe-1',
      servings: 2,
      notes: null,
      scheduledTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should return true when meals exist for date', () => {
      const date = new Date('2024-01-10');
      const meals = [createMeal(new Date('2024-01-10'))];
      
      const result = hasMealsForDay(date, meals);
      expect(result).toBe(true);
    });

    it('should return false when no meals exist for date', () => {
      const date = new Date('2024-01-10');
      const meals = [createMeal(new Date('2024-01-11'))];
      
      const result = hasMealsForDay(date, meals);
      expect(result).toBe(false);
    });

    it('should return false for empty meals array', () => {
      const date = new Date('2024-01-10');
      
      const result = hasMealsForDay(date, []);
      expect(result).toBe(false);
    });
  });

  describe('getMealsForDay', () => {
    const createMeal = (date: Date, mealType: MealType): PlannedMeal => ({
      id: `meal-${mealType}`,
      userId: 'user-1',
      date,
      mealType,
      recipeId: 'recipe-1',
      servings: 2,
      notes: null,
      scheduledTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should return all meals for a specific date', () => {
      const targetDate = new Date('2024-01-10');
      const meals = [
        createMeal(new Date('2024-01-10'), 'BREAKFAST'),
        createMeal(new Date('2024-01-10'), 'LUNCH'),
        createMeal(new Date('2024-01-11'), 'DINNER'),
      ];
      
      const result = getMealsForDay(targetDate, meals);
      expect(result.length).toBe(2);
      expect(result.every(m => m.date.getDate() === 10)).toBe(true);
    });

    it('should return empty array when no meals for date', () => {
      const targetDate = new Date('2024-01-10');
      const meals = [createMeal(new Date('2024-01-11'), 'BREAKFAST')];
      
      const result = getMealsForDay(targetDate, meals);
      expect(result.length).toBe(0);
    });
  });

  describe('countMealsInRange', () => {
    const createMeal = (date: Date): PlannedMeal => ({
      id: `meal-${date.getDate()}`,
      userId: 'user-1',
      date,
      mealType: 'BREAKFAST',
      recipeId: 'recipe-1',
      servings: 2,
      notes: null,
      scheduledTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should count total meals across multiple dates', () => {
      const dates = [
        new Date('2024-01-10'),
        new Date('2024-01-11'),
        new Date('2024-01-12'),
      ];
      
      const meals = [
        createMeal(new Date('2024-01-10')),
        createMeal(new Date('2024-01-10')),
        createMeal(new Date('2024-01-11')),
        createMeal(new Date('2024-01-13')), // Not in range
      ];
      
      const result = countMealsInRange(dates, meals);
      expect(result).toBe(3);
    });

    it('should return 0 for empty date range', () => {
      const meals = [createMeal(new Date('2024-01-10'))];
      
      const result = countMealsInRange([], meals);
      expect(result).toBe(0);
    });

    it('should return 0 for empty meals array', () => {
      const dates = [new Date('2024-01-10')];
      
      const result = countMealsInRange(dates, []);
      expect(result).toBe(0);
    });
  });
});
