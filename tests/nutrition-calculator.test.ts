/**
 * Nutrition Calculator Test Suite
 * 
 * Tests nutritional calculation functions to ensure accuracy and reliability.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMealNutrition,
  calculateTotalNutrition,
  calculateNutritionProgress,
  calculateNutritionProgressCapped,
  calculateMacroRatios,
  calculateWeeklyAverage,
  calculatePerMealAverage,
  getNutritionStatusColor,
  getNutritionProgressBarColor,
  getPresetGoals,
  formatNutritionValue,
  hasNutritionData,
  type RecipeNutrition,
  type MealWithNutrition,
  type NutritionGoal,
} from '@/lib/nutrition-calculator';

describe('Nutrition Calculator', () => {
  describe('calculateMealNutrition', () => {
    it('should calculate nutrition for a single serving', () => {
      const recipe: RecipeNutrition = {
        calories: 500,
        protein: 25,
        carbs: 50,
        fat: 20,
        fiber: 5,
        sugar: 10,
        sodium: 600,
      };

      const result = calculateMealNutrition(recipe, 1);
      expect(result.calories).toBe(500);
      expect(result.protein).toBe(25);
      expect(result.carbs).toBe(50);
      expect(result.fat).toBe(20);
      expect(result.fiber).toBe(5);
    });

    it('should scale nutrition for multiple servings', () => {
      const recipe: RecipeNutrition = {
        calories: 500,
        protein: 25,
        carbs: 50,
        fat: 20,
        fiber: 5,
        sugar: 10,
        sodium: 600,
      };

      const result = calculateMealNutrition(recipe, 2);
      expect(result.calories).toBe(1000);
      expect(result.protein).toBe(50);
      expect(result.carbs).toBe(100);
      expect(result.fat).toBe(40);
    });

    it('should handle null recipe', () => {
      const result = calculateMealNutrition(null, 1);
      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
    });

    it('should handle undefined recipe', () => {
      const result = calculateMealNutrition(undefined, 1);
      expect(result.calories).toBe(0);
    });

    it('should handle missing nutrition values', () => {
      const recipe: RecipeNutrition = {
        calories: 300,
      };

      const result = calculateMealNutrition(recipe, 1);
      expect(result.calories).toBe(300);
      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
    });
  });

  describe('calculateTotalNutrition', () => {
    it('should sum nutrition from multiple meals', () => {
      const meals: MealWithNutrition[] = [
        {
          servings: 1,
          recipe: { calories: 500, protein: 25, carbs: 50, fat: 20, fiber: 5, sugar: 10, sodium: 600 },
        },
        {
          servings: 1,
          recipe: { calories: 300, protein: 15, carbs: 30, fat: 10, fiber: 3, sugar: 5, sodium: 400 },
        },
      ];

      const result = calculateTotalNutrition(meals);
      expect(result.calories).toBe(800);
      expect(result.protein).toBe(40);
      expect(result.carbs).toBe(80);
      expect(result.fat).toBe(30);
      expect(result.mealsCount).toBe(2);
    });

    it('should handle empty meals array', () => {
      const result = calculateTotalNutrition([]);
      expect(result.calories).toBe(0);
      expect(result.mealsCount).toBe(0);
    });

    it('should handle meals with null recipes', () => {
      const meals: MealWithNutrition[] = [
        { servings: 1, recipe: null },
        {
          servings: 1,
          recipe: { calories: 500, protein: 25, carbs: 50, fat: 20, fiber: 5, sugar: 10, sodium: 600 },
        },
      ];

      const result = calculateTotalNutrition(meals);
      expect(result.calories).toBe(500);
      expect(result.mealsCount).toBe(1);
    });

    it('should account for servings in totals', () => {
      const meals: MealWithNutrition[] = [
        {
          servings: 2,
          recipe: { calories: 500, protein: 25, carbs: 50, fat: 20, fiber: 5, sugar: 10, sodium: 600 },
        },
      ];

      const result = calculateTotalNutrition(meals);
      expect(result.calories).toBe(1000);
      expect(result.protein).toBe(50);
    });
  });

  describe('calculateNutritionProgress', () => {
    it('should calculate percentage progress toward goals', () => {
      const current = {
        calories: 1500,
        protein: 75,
        carbs: 150,
        fat: 50,
        fiber: 20,
        sugar: 30,
        sodium: 1500,
      };

      const goal: NutritionGoal = {
        targetCalories: 2000,
        targetProtein: 100,
        targetCarbs: 200,
        targetFat: 67,
        targetFiber: 25,
      };

      const result = calculateNutritionProgress(current, goal);
      expect(result.calories.percentage).toBe(75);
      expect(result.protein.percentage).toBe(75);
      expect(result.carbs.percentage).toBe(75);
    });

    it('should handle exceeding goals', () => {
      const current = {
        calories: 2500,
        protein: 120,
        carbs: 250,
        fat: 80,
        fiber: 30,
        sugar: 40,
        sodium: 2000,
      };

      const goal: NutritionGoal = {
        targetCalories: 2000,
        targetProtein: 100,
        targetCarbs: 200,
        targetFat: 67,
        targetFiber: 25,
      };

      const result = calculateNutritionProgress(current, goal);
      expect(result.calories.percentage).toBe(125);
      expect(result.protein.percentage).toBe(120);
    });

    it('should handle zero targets', () => {
      const current = {
        calories: 1000,
        protein: 50,
        carbs: 100,
        fat: 30,
        fiber: 15,
        sugar: 20,
        sodium: 1000,
      };

      const goal: NutritionGoal = {
        targetCalories: 2000,
      };

      const result = calculateNutritionProgress(current, goal);
      expect(result.protein.percentage).toBe(0);
      expect(result.carbs.percentage).toBe(0);
    });
  });

  describe('calculateNutritionProgressCapped', () => {
    it('should cap progress at 100% when capAt100 is true', () => {
      const current = {
        calories: 2500,
        protein: 120,
        carbs: 250,
        fat: 80,
        fiber: 30,
        sugar: 40,
        sodium: 2000,
      };

      const goal: NutritionGoal = {
        targetCalories: 2000,
        targetProtein: 100,
        targetCarbs: 200,
        targetFat: 67,
        targetFiber: 25,
      };

      const result = calculateNutritionProgressCapped(current, goal, true);
      expect(result.calories.percentage).toBe(100);
      expect(result.protein.percentage).toBe(100);
      expect(result.carbs.percentage).toBe(100);
    });

    it('should not cap progress when capAt100 is false', () => {
      const current = {
        calories: 2500,
        protein: 120,
        carbs: 250,
        fat: 80,
        fiber: 30,
        sugar: 40,
        sodium: 2000,
      };

      const goal: NutritionGoal = {
        targetCalories: 2000,
        targetProtein: 100,
        targetCarbs: 200,
        targetFat: 67,
        targetFiber: 25,
      };

      const result = calculateNutritionProgressCapped(current, goal, false);
      expect(result.calories.percentage).toBe(125);
      expect(result.protein.percentage).toBe(120);
    });
  });

  describe('calculateMacroRatios', () => {
    it('should calculate macro percentages that sum to 100', () => {
      const nutrition = {
        calories: 2000,
        protein: 100, // 400 cal
        carbs: 250,   // 1000 cal
        fat: 67,      // 600 cal
        fiber: 25,
        sugar: 30,
        sodium: 1500,
      };

      const result = calculateMacroRatios(nutrition);
      expect(result.proteinPercent + result.carbsPercent + result.fatPercent).toBe(100);
    });

    it('should handle zero calories', () => {
      const nutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };

      const result = calculateMacroRatios(nutrition);
      expect(result.proteinPercent).toBe(0);
      expect(result.carbsPercent).toBe(0);
      expect(result.fatPercent).toBe(0);
    });
  });

  describe('calculateWeeklyAverage', () => {
    it('should calculate average nutrition per day', () => {
      const dailyNutrition = [
        { calories: 2000, protein: 100, carbs: 200, fat: 67, fiber: 25, sugar: 30, sodium: 1500, mealsCount: 3 },
        { calories: 1800, protein: 90, carbs: 180, fat: 60, fiber: 22, sugar: 28, sodium: 1400, mealsCount: 3 },
        { calories: 2200, protein: 110, carbs: 220, fat: 73, fiber: 28, sugar: 32, sodium: 1600, mealsCount: 4 },
      ];

      const result = calculateWeeklyAverage(dailyNutrition);
      expect(result.calories).toBe(2000);
      expect(result.protein).toBe(100);
      expect(result.mealsCount).toBe(3);
    });

    it('should handle empty array', () => {
      const result = calculateWeeklyAverage([]);
      expect(result.calories).toBe(0);
      expect(result.mealsCount).toBe(0);
    });
  });

  describe('calculatePerMealAverage', () => {
    it('should calculate average nutrition per meal', () => {
      const meals: MealWithNutrition[] = [
        {
          servings: 1,
          recipe: { calories: 600, protein: 30, carbs: 60, fat: 20, fiber: 6, sugar: 12, sodium: 700 },
        },
        {
          servings: 1,
          recipe: { calories: 400, protein: 20, carbs: 40, fat: 13, fiber: 4, sugar: 8, sodium: 500 },
        },
      ];

      const result = calculatePerMealAverage(meals);
      expect(result.calories).toBe(500);
      expect(result.protein).toBe(25);
    });

    it('should handle empty meals array', () => {
      const result = calculatePerMealAverage([]);
      expect(result.calories).toBe(0);
    });

    it('should filter out meals without data', () => {
      const meals: MealWithNutrition[] = [
        { servings: 1, recipe: null },
        {
          servings: 1,
          recipe: { calories: 500, protein: 25, carbs: 50, fat: 20, fiber: 5, sugar: 10, sodium: 600 },
        },
      ];

      const result = calculatePerMealAverage(meals);
      expect(result.calories).toBe(500);
      expect(result.protein).toBe(25);
    });
  });

  describe('getNutritionStatusColor', () => {
    it('should return yellow for low progress', () => {
      expect(getNutritionStatusColor(50)).toBe('text-yellow-600');
      expect(getNutritionStatusColor(79)).toBe('text-yellow-600');
    });

    it('should return green for optimal progress', () => {
      expect(getNutritionStatusColor(80)).toBe('text-green-600');
      expect(getNutritionStatusColor(100)).toBe('text-green-600');
      expect(getNutritionStatusColor(120)).toBe('text-green-600');
    });

    it('should return red for excessive progress', () => {
      expect(getNutritionStatusColor(121)).toBe('text-red-600');
      expect(getNutritionStatusColor(150)).toBe('text-red-600');
    });
  });

  describe('getNutritionProgressBarColor', () => {
    it('should return yellow for low progress', () => {
      expect(getNutritionProgressBarColor(50)).toBe('bg-yellow-500');
    });

    it('should return green for optimal progress', () => {
      expect(getNutritionProgressBarColor(100)).toBe('bg-green-500');
    });

    it('should return red for excessive progress', () => {
      expect(getNutritionProgressBarColor(130)).toBe('bg-red-500');
    });
  });

  describe('getPresetGoals', () => {
    it('should return weight-loss goals', () => {
      const goal = getPresetGoals('weight-loss');
      expect(goal.targetCalories).toBe(1800);
      expect(goal.targetProtein).toBe(135);
      expect(goal.targetFiber).toBe(25);
    });

    it('should return muscle-gain goals', () => {
      const goal = getPresetGoals('muscle-gain');
      expect(goal.targetCalories).toBe(2500);
      expect(goal.targetProtein).toBe(188);
      expect(goal.targetFiber).toBe(30);
    });

    it('should return maintenance goals', () => {
      const goal = getPresetGoals('maintenance');
      expect(goal.targetCalories).toBe(2000);
      expect(goal.targetProtein).toBe(100);
      expect(goal.targetFiber).toBe(28);
    });
  });

  describe('formatNutritionValue', () => {
    it('should format gram values with one decimal', () => {
      expect(formatNutritionValue(25.5, 'g')).toBe('25.5g');
      expect(formatNutritionValue(100, 'g')).toBe('100.0g');
    });

    it('should format milligram values as integers', () => {
      expect(formatNutritionValue(1500.7, 'mg')).toBe('1501mg');
      expect(formatNutritionValue(600, 'mg')).toBe('600mg');
    });

    it('should format calorie values as integers', () => {
      expect(formatNutritionValue(2000.5, 'kcal')).toBe('2001 kcal');
      expect(formatNutritionValue(1500, 'kcal')).toBe('1500 kcal');
    });

    it('should handle zero values', () => {
      expect(formatNutritionValue(0, 'g')).toBe('0g');
      expect(formatNutritionValue(0, 'mg')).toBe('0mg');
      expect(formatNutritionValue(0, 'kcal')).toBe('0kcal');
    });
  });

  describe('hasNutritionData', () => {
    it('should return true if recipe has any nutrition data', () => {
      expect(hasNutritionData({ calories: 500 })).toBe(true);
      expect(hasNutritionData({ protein: 25 })).toBe(true);
      expect(hasNutritionData({ carbs: 50 })).toBe(true);
      expect(hasNutritionData({ fat: 20 })).toBe(true);
    });

    it('should return false if recipe has no nutrition data', () => {
      expect(hasNutritionData({})).toBe(false);
      expect(hasNutritionData({ servingSize: '1 cup' })).toBe(false);
    });

    it('should return false for null or undefined recipe', () => {
      expect(hasNutritionData(null)).toBe(false);
      expect(hasNutritionData(undefined)).toBe(false);
    });

    it('should return false if all nutrition values are zero or null', () => {
      expect(hasNutritionData({ calories: 0, protein: 0, carbs: 0, fat: 0 })).toBe(false);
      expect(hasNutritionData({ calories: null, protein: null, carbs: null, fat: null })).toBe(false);
    });
  });

  describe('Edge Cases and Reliability', () => {
    it('should never produce NaN values', () => {
      const recipe: RecipeNutrition = { calories: NaN, protein: NaN };
      const result = calculateMealNutrition(recipe, 1);
      expect(Number.isNaN(result.calories)).toBe(false);
      expect(Number.isNaN(result.protein)).toBe(false);
    });

    it('should handle extreme serving sizes', () => {
      const recipe: RecipeNutrition = { calories: 500, protein: 25 };
      const result = calculateMealNutrition(recipe, 0);
      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
    });

    it('should maintain precision for small values', () => {
      const recipe: RecipeNutrition = { protein: 0.5, fat: 0.3 };
      const result = calculateMealNutrition(recipe, 2);
      expect(result.protein).toBe(1);
      expect(result.fat).toBe(0.6);
    });
  });
});
