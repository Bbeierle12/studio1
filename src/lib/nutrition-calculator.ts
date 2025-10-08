/**
 * Nutrition Calculator Utility
 *
 * Provides functions for calculating nutritional information from recipes and meal plans.
 * Uses safe math operations to prevent NaN/Infinity. Keeps full precision internally.
 */

import {
  safeDiv,
  safePercentage,
  safeAverage,
  clamp,
  normalizeMacroPercentages,
  capProgress,
} from './math-utils';
import {
  CALORIES_PER_GRAM_PROTEIN,
  CALORIES_PER_GRAM_CARBS,
  CALORIES_PER_GRAM_FAT,
} from './conversion-constants';

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface RecipeNutrition {
  servingSize?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
}

export interface NutritionGoal {
  targetCalories: number;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFat?: number | null;
  targetFiber?: number | null;
}

export interface MealWithNutrition {
  servings: number;
  recipe: RecipeNutrition | null;
}

export interface NutritionSummary extends NutritionData {
  mealsCount: number;
}

export interface NutritionProgress {
  calories: { current: number; target: number; percentage: number };
  protein: { current: number; target: number; percentage: number };
  carbs: { current: number; target: number; percentage: number };
  fat: { current: number; target: number; percentage: number };
  fiber: { current: number; target: number; percentage: number };
}

export interface MacroRatios {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

/**
 * Calculate nutrition for a single meal based on servings
 */
export function calculateMealNutrition(
  recipe: RecipeNutrition | null | undefined,
  servings: number = 1
): NutritionData {
  if (!recipe) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };
  }

  return {
    calories: Math.round((recipe.calories || 0) * servings),
    protein: parseFloat(((recipe.protein || 0) * servings).toFixed(1)),
    carbs: parseFloat(((recipe.carbs || 0) * servings).toFixed(1)),
    fat: parseFloat(((recipe.fat || 0) * servings).toFixed(1)),
    fiber: parseFloat(((recipe.fiber || 0) * servings).toFixed(1)),
    sugar: parseFloat(((recipe.sugar || 0) * servings).toFixed(1)),
    sodium: Math.round((recipe.sodium || 0) * servings),
  };
}

/**
 * Calculate total nutrition from multiple meals
 */
export function calculateTotalNutrition(
  meals: MealWithNutrition[]
): NutritionSummary {
  const totals = meals.reduce(
    (acc, meal) => {
      const mealNutrition = calculateMealNutrition(meal.recipe, meal.servings);
      return {
        calories: acc.calories + mealNutrition.calories,
        protein: acc.protein + mealNutrition.protein,
        carbs: acc.carbs + mealNutrition.carbs,
        fat: acc.fat + mealNutrition.fat,
        fiber: acc.fiber + mealNutrition.fiber,
        sugar: acc.sugar + mealNutrition.sugar,
        sodium: acc.sodium + mealNutrition.sodium,
      };
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    }
  );

  return {
    ...totals,
    calories: Math.round(totals.calories),
    protein: parseFloat(totals.protein.toFixed(1)),
    carbs: parseFloat(totals.carbs.toFixed(1)),
    fat: parseFloat(totals.fat.toFixed(1)),
    fiber: parseFloat(totals.fiber.toFixed(1)),
    sugar: parseFloat(totals.sugar.toFixed(1)),
    sodium: Math.round(totals.sodium),
    mealsCount: meals.filter(m => m.recipe && (m.recipe.calories || 0) > 0).length,
  };
}

/**
 * Calculate progress toward nutrition goals
 * Uses safe division and keeps full precision internally
 */
export function calculateNutritionProgress(
  current: NutritionData,
  goal: NutritionGoal
): NutritionProgress {
  const calculateProgress = (current: number, target: number) => {
    const percentage = Math.round(safePercentage(current, target));
    return { current, target, percentage };
  };

  return {
    calories: calculateProgress(current.calories, goal.targetCalories),
    protein: calculateProgress(current.protein, goal.targetProtein || 0),
    carbs: calculateProgress(current.carbs, goal.targetCarbs || 0),
    fat: calculateProgress(current.fat, goal.targetFat || 0),
    fiber: calculateProgress(current.fiber, goal.targetFiber || 0),
  };
}

/**
 * Calculate progress with optional UI capping at 100%
 */
export function calculateNutritionProgressCapped(
  current: NutritionData,
  goal: NutritionGoal,
  capAt100: boolean = true
): NutritionProgress {
  const maxPercent = capAt100 ? 100 : Infinity;
  
  const calculateProgress = (current: number, target: number) => {
    const percentage = Math.round(capProgress(current, target, maxPercent));
    return { current, target, percentage };
  };

  return {
    calories: calculateProgress(current.calories, goal.targetCalories),
    protein: calculateProgress(current.protein, goal.targetProtein || 0),
    carbs: calculateProgress(current.carbs, goal.targetCarbs || 0),
    fat: calculateProgress(current.fat, goal.targetFat || 0),
    fiber: calculateProgress(current.fiber, goal.targetFiber || 0),
  };
}

/**
 * Calculate macro ratios (percentage of calories from each macro)
 * Enforces invariant: percentages always sum to exactly 100%
 */
export function calculateMacroRatios(nutrition: NutritionData): MacroRatios {
  return normalizeMacroPercentages(
    nutrition.protein,
    nutrition.carbs,
    nutrition.fat,
    nutrition.calories
  );
}

/**
 * Get color coding for nutrition progress
 */
export function getNutritionStatusColor(percentage: number): string {
  if (percentage < 80) return 'text-yellow-600';
  if (percentage >= 80 && percentage <= 120) return 'text-green-600';
  return 'text-red-600';
}

/**
 * Get background color for nutrition progress bars
 */
export function getNutritionProgressBarColor(percentage: number): string {
  if (percentage < 80) return 'bg-yellow-500';
  if (percentage >= 80 && percentage <= 120) return 'bg-green-500';
  return 'bg-red-500';
}

/**
 * Calculate weekly average nutrition (per-day average)
 * Handles empty arrays safely, keeps precision internally
 */
export function calculateWeeklyAverage(
  dailyNutrition: NutritionSummary[]
): NutritionSummary {
  if (dailyNutrition.length === 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      mealsCount: 0,
    };
  }

  const days = dailyNutrition.length;

  return {
    calories: Math.round(safeAverage(dailyNutrition.map(d => d.calories))),
    protein: parseFloat(safeAverage(dailyNutrition.map(d => d.protein)).toFixed(1)),
    carbs: parseFloat(safeAverage(dailyNutrition.map(d => d.carbs)).toFixed(1)),
    fat: parseFloat(safeAverage(dailyNutrition.map(d => d.fat)).toFixed(1)),
    fiber: parseFloat(safeAverage(dailyNutrition.map(d => d.fiber)).toFixed(1)),
    sugar: parseFloat(safeAverage(dailyNutrition.map(d => d.sugar)).toFixed(1)),
    sodium: Math.round(safeAverage(dailyNutrition.map(d => d.sodium))),
    mealsCount: Math.round(safeAverage(dailyNutrition.map(d => d.mealsCount))),
  };
}

/**
 * Calculate per-meal average nutrition
 * Distinct from per-day average
 */
export function calculatePerMealAverage(
  meals: MealWithNutrition[]
): NutritionData {
  if (meals.length === 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };
  }

  const mealsWithData = meals.filter(m => m.recipe && (m.recipe.calories || 0) > 0);
  
  if (mealsWithData.length === 0) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };
  }

  return {
    calories: Math.round(safeAverage(mealsWithData.map(m => calculateMealNutrition(m.recipe, m.servings).calories))),
    protein: parseFloat(safeAverage(mealsWithData.map(m => calculateMealNutrition(m.recipe, m.servings).protein)).toFixed(1)),
    carbs: parseFloat(safeAverage(mealsWithData.map(m => calculateMealNutrition(m.recipe, m.servings).carbs)).toFixed(1)),
    fat: parseFloat(safeAverage(mealsWithData.map(m => calculateMealNutrition(m.recipe, m.servings).fat)).toFixed(1)),
    fiber: parseFloat(safeAverage(mealsWithData.map(m => calculateMealNutrition(m.recipe, m.servings).fiber)).toFixed(1)),
    sugar: parseFloat(safeAverage(mealsWithData.map(m => calculateMealNutrition(m.recipe, m.servings).sugar)).toFixed(1)),
    sodium: Math.round(safeAverage(mealsWithData.map(m => calculateMealNutrition(m.recipe, m.servings).sodium))),
  };
}

/**
 * Get preset nutrition goals based on common dietary targets
 */
export function getPresetGoals(preset: 'weight-loss' | 'muscle-gain' | 'maintenance'): NutritionGoal {
  switch (preset) {
    case 'weight-loss':
      return {
        targetCalories: 1800,
        targetProtein: 135,  // 30% of calories
        targetCarbs: 180,    // 40% of calories
        targetFat: 60,       // 30% of calories
        targetFiber: 25,
      };
    case 'muscle-gain':
      return {
        targetCalories: 2500,
        targetProtein: 188,  // 30% of calories
        targetCarbs: 313,    // 50% of calories
        targetFat: 56,       // 20% of calories
        targetFiber: 30,
      };
    case 'maintenance':
    default:
      return {
        targetCalories: 2000,
        targetProtein: 100,  // 20% of calories
        targetCarbs: 250,    // 50% of calories
        targetFat: 67,       // 30% of calories
        targetFiber: 28,
      };
  }
}

/**
 * Format nutrition value for display
 */
export function formatNutritionValue(value: number, unit: 'g' | 'mg' | 'kcal'): string {
  if (value === 0) return `0${unit}`;

  if (unit === 'g') {
    return `${value.toFixed(1)}g`;
  } else if (unit === 'mg') {
    return `${Math.round(value)}mg`;
  } else {
    return `${Math.round(value)} kcal`;
  }
}

/**
 * Check if recipe has nutrition data
 */
export function hasNutritionData(recipe: RecipeNutrition | null | undefined): boolean {
  if (!recipe) return false;
  return !!(
    recipe.calories ||
    recipe.protein ||
    recipe.carbs ||
    recipe.fat
  );
}
