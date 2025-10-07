/**
 * Nutrition Calculator Utility
 *
 * Provides functions for calculating nutritional information from recipes and meal plans.
 */

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
 */
export function calculateNutritionProgress(
  current: NutritionData,
  goal: NutritionGoal
): NutritionProgress {
  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return { current, target, percentage: 0 };
    const percentage = Math.round((current / target) * 100);
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
 */
export function calculateMacroRatios(nutrition: NutritionData): MacroRatios {
  // Calories per gram: Protein = 4, Carbs = 4, Fat = 9
  const proteinCalories = nutrition.protein * 4;
  const carbsCalories = nutrition.carbs * 4;
  const fatCalories = nutrition.fat * 9;
  const totalCalories = proteinCalories + carbsCalories + fatCalories;

  if (totalCalories === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatPercent: 0 };
  }

  return {
    proteinPercent: Math.round((proteinCalories / totalCalories) * 100),
    carbsPercent: Math.round((carbsCalories / totalCalories) * 100),
    fatPercent: Math.round((fatCalories / totalCalories) * 100),
  };
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
 * Calculate weekly average nutrition
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

  const totals = dailyNutrition.reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat,
      fiber: acc.fiber + day.fiber,
      sugar: acc.sugar + day.sugar,
      sodium: acc.sodium + day.sodium,
      mealsCount: acc.mealsCount + day.mealsCount,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      mealsCount: 0,
    }
  );

  const days = dailyNutrition.length;

  return {
    calories: Math.round(totals.calories / days),
    protein: parseFloat((totals.protein / days).toFixed(1)),
    carbs: parseFloat((totals.carbs / days).toFixed(1)),
    fat: parseFloat((totals.fat / days).toFixed(1)),
    fiber: parseFloat((totals.fiber / days).toFixed(1)),
    sugar: parseFloat((totals.sugar / days).toFixed(1)),
    sodium: Math.round(totals.sodium / days),
    mealsCount: Math.round(totals.mealsCount / days),
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
