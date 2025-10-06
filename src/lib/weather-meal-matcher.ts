import { Recipe } from '@/lib/types';

export interface WeatherConditions {
  temperature: number; // in Fahrenheit
  condition: string; // sunny, cloudy, rainy, snowy, etc.
  precipitation: number; // 0-100 percentage
  humidity?: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

export interface MealSuggestion {
  recipe: Recipe;
  score: number; // 0-100
  reasons: string[];
}

// Temperature-based meal preferences
const TEMPERATURE_PREFERENCES = {
  veryHot: { min: 85, meals: ['salad', 'cold', 'light', 'no-cook', 'smoothie', 'gazpacho'] },
  hot: { min: 75, max: 85, meals: ['grill', 'fresh', 'salad', 'summer', 'bbq', 'chilled'] },
  warm: { min: 65, max: 75, meals: ['grill', 'fresh', 'pasta', 'stir-fry', 'roasted'] },
  cool: { min: 50, max: 65, meals: ['soup', 'comfort', 'bake', 'roasted', 'casserole'] },
  cold: { min: 32, max: 50, meals: ['soup', 'stew', 'hearty', 'bake', 'comfort', 'warm'] },
  veryCold: { max: 32, meals: ['stew', 'hearty', 'soup', 'casserole', 'chili', 'pot-roast'] }
};

// Weather condition preferences
const CONDITION_PREFERENCES: Record<string, string[]> = {
  sunny: ['grill', 'bbq', 'fresh', 'salad', 'summer', 'outdoor'],
  'partly cloudy': ['grill', 'pasta', 'stir-fry', 'roasted'],
  cloudy: ['comfort', 'bake', 'pasta', 'casserole'],
  rainy: ['soup', 'stew', 'comfort', 'warm', 'cozy', 'chili'],
  drizzle: ['soup', 'pasta', 'comfort', 'warm'],
  stormy: ['stew', 'soup', 'comfort', 'hearty', 'slow-cooker'],
  snowy: ['stew', 'soup', 'hearty', 'comfort', 'chili', 'casserole'],
  fog: ['soup', 'comfort', 'warm'],
  windy: ['indoor', 'bake', 'casserole', 'one-pot']
};

// Seasonal ingredient preferences
const SEASONAL_INGREDIENTS: Record<string, string[]> = {
  spring: ['asparagus', 'peas', 'artichoke', 'strawberry', 'lettuce', 'radish', 'greens'],
  summer: ['tomato', 'corn', 'zucchini', 'cucumber', 'berries', 'peach', 'watermelon'],
  fall: ['squash', 'pumpkin', 'apple', 'sweet potato', 'brussels sprouts', 'cranberry'],
  winter: ['root vegetables', 'kale', 'cabbage', 'citrus', 'potato', 'onion', 'carrot']
};

// Course preferences by meal type
const MEAL_TYPE_PREFERENCES: Record<string, string[]> = {
  breakfast: ['Breakfast', 'Appetizer'],
  lunch: ['Appetizer', 'Main', 'Side'],
  dinner: ['Main', 'Side'],
  snack: ['Appetizer', 'Side', 'Dessert']
};

/**
 * Get temperature category for scoring
 */
function getTemperatureCategory(temp: number): string {
  if (temp >= 85) return 'veryHot';
  if (temp >= 75) return 'hot';
  if (temp >= 65) return 'warm';
  if (temp >= 50) return 'cool';
  if (temp >= 32) return 'cold';
  return 'veryCold';
}

/**
 * Normalize weather condition string for matching
 */
function normalizeCondition(condition: string): string {
  const lower = condition.toLowerCase();
  
  if (lower.includes('rain') || lower.includes('shower')) return 'rainy';
  if (lower.includes('storm') || lower.includes('thunder')) return 'stormy';
  if (lower.includes('snow') || lower.includes('flurr')) return 'snowy';
  if (lower.includes('drizzle')) return 'drizzle';
  if (lower.includes('sun') || lower.includes('clear')) return 'sunny';
  if (lower.includes('cloud') && lower.includes('partly')) return 'partly cloudy';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
  if (lower.includes('fog') || lower.includes('mist')) return 'fog';
  if (lower.includes('wind')) return 'windy';
  
  return 'partly cloudy'; // default
}

/**
 * Calculate temperature match score (0-40 points)
 */
function calculateTemperatureScore(recipe: Recipe, temp: number): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  const category = getTemperatureCategory(temp);
  const tempPrefs = TEMPERATURE_PREFERENCES[category as keyof typeof TEMPERATURE_PREFERENCES];
  const preferredMeals = tempPrefs.meals;
  
  // Check recipe tags and course for temperature match
  const recipeTags = recipe.tags || [];
  const recipeText = `${recipe.title} ${recipe.summary || ''} ${recipeTags.join(' ')}`.toLowerCase();
  
  let matchCount = 0;
  const matchedTerms: string[] = [];
  
  for (const meal of preferredMeals) {
    if (recipeText.includes(meal) || recipeTags.some(tag => tag.toLowerCase().includes(meal))) {
      matchCount++;
      matchedTerms.push(meal);
    }
  }
  
  if (matchCount > 0) {
    score = Math.min(40, matchCount * 15); // Up to 40 points
    
    // Add contextual reason
    if (temp >= 85) {
      reasons.push('Perfect for hot weather - light and refreshing');
    } else if (temp >= 75) {
      reasons.push('Great for warm weather');
    } else if (temp >= 65) {
      reasons.push('Ideal for mild temperatures');
    } else if (temp >= 50) {
      reasons.push('Warming and comforting for cool weather');
    } else if (temp >= 32) {
      reasons.push('Perfect for cold weather - hearty and warming');
    } else {
      reasons.push('Extra warming for very cold weather');
    }
  }
  
  return { score, reasons };
}

/**
 * Calculate weather condition match score (0-30 points)
 */
function calculateConditionScore(recipe: Recipe, condition: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  const normalized = normalizeCondition(condition);
  const preferredMeals = CONDITION_PREFERENCES[normalized] || [];
  
  const recipeTags = recipe.tags || [];
  const recipeText = `${recipe.title} ${recipe.summary || ''} ${recipeTags.join(' ')}`.toLowerCase();
  
  let matchCount = 0;
  
  for (const meal of preferredMeals) {
    if (recipeText.includes(meal) || recipeTags.some(tag => tag.toLowerCase().includes(meal))) {
      matchCount++;
    }
  }
  
  if (matchCount > 0) {
    score = Math.min(30, matchCount * 12);
    
    // Add weather-specific reason
    if (normalized === 'rainy' || normalized === 'stormy') {
      reasons.push('Cozy comfort food for rainy weather');
    } else if (normalized === 'sunny') {
      reasons.push('Perfect for a sunny day');
    } else if (normalized === 'snowy') {
      reasons.push('Hearty meal for snowy weather');
    } else if (normalized === 'cloudy') {
      reasons.push('Comforting for overcast skies');
    }
  }
  
  return { score, reasons };
}

/**
 * Calculate seasonal ingredient match score (0-20 points)
 */
function calculateSeasonalScore(recipe: Recipe, season: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  const seasonalIngredients = SEASONAL_INGREDIENTS[season] || [];
  const ingredients = recipe.ingredients?.toLowerCase() || '';
  
  let matchCount = 0;
  const matchedIngredients: string[] = [];
  
  for (const ingredient of seasonalIngredients) {
    if (ingredients.includes(ingredient)) {
      matchCount++;
      matchedIngredients.push(ingredient);
    }
  }
  
  if (matchCount > 0) {
    score = Math.min(20, matchCount * 8);
    reasons.push(`Features seasonal ${season} ingredients`);
  }
  
  return { score, reasons };
}

/**
 * Calculate meal type preference score (0-10 points)
 */
function calculateMealTypeScore(recipe: Recipe, mealType?: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  if (!mealType || !recipe.course) {
    return { score, reasons };
  }
  
  const preferredCourses = MEAL_TYPE_PREFERENCES[mealType.toLowerCase()] || [];
  
  if (preferredCourses.includes(recipe.course)) {
    score = 10;
    reasons.push(`Great for ${mealType}`);
  }
  
  return { score, reasons };
}

/**
 * Main function to get meal suggestions based on weather
 */
export function getSuggestedMeals(
  recipes: Recipe[],
  weather: WeatherConditions,
  mealType?: string,
  limit: number = 5
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = [];
  
  for (const recipe of recipes) {
    const tempResult = calculateTemperatureScore(recipe, weather.temperature);
    const conditionResult = calculateConditionScore(recipe, weather.condition);
    const seasonalResult = calculateSeasonalScore(recipe, weather.season);
    const mealTypeResult = calculateMealTypeScore(recipe, mealType);
    
    const totalScore = 
      tempResult.score + 
      conditionResult.score + 
      seasonalResult.score + 
      mealTypeResult.score;
    
    // Only include recipes with a minimum score
    if (totalScore >= 15) {
      const allReasons = [
        ...tempResult.reasons,
        ...conditionResult.reasons,
        ...seasonalResult.reasons,
        ...mealTypeResult.reasons
      ];
      
      suggestions.push({
        recipe,
        score: totalScore,
        reasons: allReasons
      });
    }
  }
  
  // Sort by score (highest first) and return top N
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get current season based on month
 */
export function getCurrentSeason(date: Date = new Date()): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = date.getMonth(); // 0-11
  
  if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'fall'; // Sep, Oct, Nov
  return 'winter'; // Dec, Jan, Feb
}
