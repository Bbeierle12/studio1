import type { 
  WeatherContext, 
  MealTag, 
  MealRecommendation, 
  RecommendationContext,
  Recipe,
  SeasonalInfo 
} from './types';
import { getRecipes } from './data';

/**
 * Get seasonal information for meal recommendations
 */
function getSeasonalInfo(season: 'spring' | 'summer' | 'fall' | 'winter', month: number): SeasonalInfo {
  const seasonalData: Record<string, SeasonalInfo> = {
    spring: {
      season: 'spring',
      producePeak: ['asparagus', 'artichokes', 'peas', 'lettuce', 'spinach', 'radishes', 'spring onions', 'strawberries'],
      produceAvailable: ['carrots', 'broccoli', 'cauliflower', 'kale', 'leeks', 'mushrooms', 'potatoes'],
      cookingMethods: ['steaming', 'sautéing', 'grilling', 'roasting', 'fresh salads'],
      flavors: ['fresh herbs', 'lemon', 'garlic', 'light vinaigrettes', 'olive oil'],
      holidayInfluences: month === 3 || month === 4 ? ['easter', 'passover'] : undefined
    },
    summer: {
      season: 'summer',
      producePeak: ['tomatoes', 'zucchini', 'corn', 'berries', 'stone fruits', 'bell peppers', 'eggplant', 'cucumbers', 'basil'],
      produceAvailable: ['lettuce', 'spinach', 'green beans', 'carrots', 'onions', 'potatoes'],
      cookingMethods: ['grilling', 'no-cook', 'chilled', 'light sautéing', 'fresh preparation'],
      flavors: ['fresh herbs', 'citrus', 'light seasonings', 'cold soups', 'fresh fruit'],
    },
    fall: {
      season: 'fall',
      producePeak: ['pumpkin', 'squash', 'apples', 'pears', 'sweet potatoes', 'brussels sprouts', 'cranberries', 'pomegranates'],
      produceAvailable: ['carrots', 'onions', 'potatoes', 'cabbage', 'kale', 'broccoli', 'cauliflower'],
      cookingMethods: ['roasting', 'braising', 'baking', 'stewing', 'soup making'],
      flavors: ['warm spices', 'cinnamon', 'nutmeg', 'sage', 'thyme', 'apple cider', 'maple'],
      holidayInfluences: month >= 10 ? ['halloween', 'thanksgiving'] : undefined
    },
    winter: {
      season: 'winter',
      producePeak: ['citrus fruits', 'root vegetables', 'winter squash', 'kale', 'collards', 'leeks', 'potatoes'],
      produceAvailable: ['onions', 'carrots', 'cabbage', 'brussels sprouts', 'apples', 'pears'],
      cookingMethods: ['braising', 'slow cooking', 'stewing', 'baking', 'roasting', 'soup making'],
      flavors: ['warming spices', 'ginger', 'cinnamon', 'hearty herbs', 'rich broths', 'comfort seasonings'],
      holidayInfluences: month === 12 || month === 1 ? ['christmas', 'new year'] : undefined
    }
  };

  return seasonalData[season];
}

/**
 * Core logic to pick meal tags based on weather context and seasonality
 * This is the heart of the Forecast-to-Feast feature
 */
export function pickMealTags(ctx: WeatherContext): MealTag[] {
  const tags: MealTag[] = [];
  const { weather, sun, isWeeknight, timeOfDay, season, month } = ctx;
  
  // Get seasonal information
  const seasonalInfo = getSeasonalInfo(season, month);
  
  // Always add current season tag
  tags.push(season);
  
  // Temperature-based logic
  const hot = weather.feelsLike >= 85;
  const warm = weather.feelsLike >= 70 && weather.feelsLike < 85;
  const cool = weather.feelsLike >= 55 && weather.feelsLike < 70;
  const cold = weather.feelsLike < 55;
  
  // Weather condition logic
  const rainy = weather.precipitation >= 40;
  const highHumidity = weather.humidity >= 70;
  const windy = weather.windSpeed >= 20;
  const poorAir = weather.aqi >= 100;
  const goodVisibility = weather.visibility >= 5;
  
  // Time-based logic
  const goldenHour = sun.minutesToSunset >= 90 && sun.minutesToSunset <= 150;
  const soonSunset = sun.minutesToSunset < 90 && sun.minutesToSunset > 0;
  const afterDark = !sun.isDaytime || sun.minutesToSunset <= 0;
  
  // Weather-driven recommendations
  if (hot) {
    if (goldenHour && weather.windSpeed < 15 && weather.aqi < 80) {
      // Perfect grilling conditions - but still add some cooling options
      tags.push('grill', 'summer', 'light');
    } else {
      // Too hot or not ideal for outdoor cooking
      tags.push('no-cook', 'chilled', 'salad', 'fresh');
    }
  } else if (warm) {
    if (goldenHour && !windy && !poorAir) {
      tags.push('grill', 'fresh');
    } else if (goodVisibility) {
      tags.push('light', 'fresh', 'seasonal');
    }
  } else if (cool) {
    if (rainy || highHumidity) {
      tags.push('soup', 'comfort', 'warm');
    } else {
      tags.push('seasonal', 'hearty');
    }
  } else if (cold) {
    tags.push('soup', 'stew', 'bake', 'comfort', 'warm', 'hearty');
  }
  
  // Weather condition overrides
  if (rainy || weather.precipitation >= 60) {
    // Remove outdoor tags and add indoor comfort foods
    const outdoorTags = ['grill', 'bbq'];
    tags.splice(0, tags.length, ...tags.filter(tag => !outdoorTags.includes(tag)));
    tags.push('soup', 'stew', 'bake', 'comfort', 'indoor');
  }
  
  if (windy || poorAir) {
    // Force indoor cooking
    const outdoorTags = ['grill', 'bbq'];
    tags.splice(0, tags.length, ...tags.filter(tag => !outdoorTags.includes(tag)));
    tags.push('sheet-pan', 'air-fryer', 'stovetop', 'indoor');
  }
  
  // Time of day considerations
  if (timeOfDay === 'morning') {
    tags.push('fresh', 'light');
  } else if (timeOfDay === 'evening' && !afterDark) {
    if (weather.feelsLike >= 70 && !windy && !poorAir) {
      tags.push('grill');
    }
  } else if (timeOfDay === 'night' || afterDark) {
    tags.push('comfort', 'warm');
  }
  
  // Seasonal considerations based on current season
  if (season === 'spring') {
    tags.push('fresh', 'light');
    // Spring produce focus
    if (month >= 4) { // Late spring
      tags.push('leafy-greens');
    }
  } else if (season === 'summer') {
    tags.push('fresh', 'seasonal');
    if (hot || warm) {
      tags.push('stone-fruit', 'berries');
    }
  } else if (season === 'fall') {
    tags.push('seasonal', 'hearty');
    if (month >= 10) { // Late fall
      tags.push('squash', 'apples', 'root-vegetables');
      if (month === 11) { // November - Thanksgiving influence
        tags.push('holiday');
      }
    }
  } else if (season === 'winter') {
    tags.push('hearty', 'comfort', 'warm');
    if (month <= 2 || month === 12) { // Deep winter
      tags.push('citrus', 'root-vegetables');
      if (month === 12) { // December - Holiday influence
        tags.push('holiday');
      }
    }
  }
  
  // Seasonal cooking method preferences
  const preferredMethods = seasonalInfo.cookingMethods;
  if (preferredMethods.includes('grilling') && !rainy && !windy && goodVisibility) {
    if (!tags.includes('grill')) tags.push('grill');
  }
  if (preferredMethods.includes('no-cook') && (hot || season === 'summer')) {
    if (!tags.includes('no-cook')) tags.push('no-cook');
  }
  if (preferredMethods.includes('soup making') && (cold || rainy || season === 'winter')) {
    if (!tags.includes('soup')) tags.push('soup');
  }
  if (preferredMethods.includes('roasting') && (cool || cold || season === 'fall')) {
    if (!tags.includes('bake')) tags.push('bake');
  }
  
  // Day of week logic
  if (isWeeknight) {
    tags.push('30-min', 'quick', 'one-pot', 'weeknight');
  } else {
    const day = new Date().getDay();
    if (day === 5) { // Friday
      tags.push('crowd-pleaser');
    } else if (day === 0) { // Sunday
      tags.push('batch-cook', 'leftovers');
    }
  }
  
  // Remove duplicates and return
  return [...new Set(tags)];
}

/**
 * Generate explanation text for why certain recipes were recommended
 */
export function generateRecommendationReason(
  ctx: WeatherContext, 
  selectedTags: MealTag[]
): string {
  const { weather, sun, isWeeknight } = ctx;
  const reasons: string[] = [];
  
  // Weather reasons
  if (weather.feelsLike >= 85) {
    reasons.push(`${weather.feelsLike}°F feels-like temperature`);
  } else if (weather.feelsLike <= 55) {
    reasons.push(`chilly ${weather.feelsLike}°F weather`);
  }
  
  if (weather.precipitation >= 40) {
    reasons.push(`${weather.precipitation}% chance of rain`);
  }
  
  if (weather.windSpeed >= 20) {
    reasons.push(`${weather.windSpeed} mph winds`);
  }
  
  if (weather.aqi >= 100) {
    reasons.push(`poor air quality (AQI ${weather.aqi})`);
  }
  
  // Time reasons
  if (sun.minutesToSunset > 0 && sun.minutesToSunset <= 150) {
    const hours = Math.floor(sun.minutesToSunset / 60);
    const minutes = sun.minutesToSunset % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    reasons.push(`${timeStr} until sunset`);
  }
  
  if (isWeeknight) {
    reasons.push('weeknight schedule');
  }
  
  if (reasons.length === 0) {
    return `Perfect ${weather.temperature}°F weather for cooking`;
  }
  
  return `Because of ${reasons.join(', ')}`;
}

/**
 * Calculate confidence score for a recipe based on matching tags and conditions
 */
function calculateConfidence(
  recipe: Recipe, 
  selectedTags: MealTag[],
  ctx: WeatherContext
): number {
  let confidence = 0.5; // Base confidence
  
  // Check recipe tags for matches (assuming recipe.tags contains strings)
  const recipeTags = recipe.tags.map(tag => tag.toLowerCase());
  const matchingTags = selectedTags.filter(tag => 
    recipeTags.some(recipeTag => 
      recipeTag.includes(tag) || tag.includes(recipeTag)
    )
  );
  
  // Boost confidence for tag matches
  confidence += matchingTags.length * 0.15;
  
  // Time-based confidence adjustments
  if (ctx.isWeeknight && recipe.prepTime && recipe.prepTime <= 30) {
    confidence += 0.2;
  }
  
  // Weather-specific adjustments
  if (ctx.weather.feelsLike >= 85) {
    // Prefer recipes with cooling ingredients or no-cook methods
    const coolingTerms = ['salad', 'cold', 'chilled', 'gazpacho', 'ceviche', 'no-cook'];
    if (coolingTerms.some(term => 
      recipe.title.toLowerCase().includes(term) ||
      recipe.ingredients.toLowerCase().includes(term)
    )) {
      confidence += 0.25;
    }
  } else if (ctx.weather.feelsLike <= 55) {
    // Prefer warming, comfort foods
    const warmingTerms = ['soup', 'stew', 'bake', 'roast', 'hot', 'warm', 'comfort'];
    if (warmingTerms.some(term => 
      recipe.title.toLowerCase().includes(term) ||
      recipe.course?.toLowerCase().includes(term)
    )) {
      confidence += 0.25;
    }
  }
  
  // Seasonal adjustments based on ingredients
  const month = new Date().getMonth();
  const isSummer = month >= 5 && month <= 8;
  const isWinter = month <= 2 || month >= 11;
  
  if (isSummer) {
    const summerIngredients = ['tomato', 'cucumber', 'basil', 'corn', 'peach', 'berry'];
    if (summerIngredients.some(ingredient => 
      recipe.ingredients.toLowerCase().includes(ingredient)
    )) {
      confidence += 0.1;
    }
  } else if (isWinter) {
    const winterIngredients = ['root vegetable', 'squash', 'potato', 'onion', 'garlic'];
    if (winterIngredients.some(ingredient => 
      recipe.ingredients.toLowerCase().includes(ingredient)
    )) {
      confidence += 0.1;
    }
  }
  
  return Math.min(1.0, confidence);
}

/**
 * Filter and rank recipes based on selected meal tags and weather context
 */
async function findMatchingRecipes(
  selectedTags: MealTag[],
  ctx: WeatherContext,
  limit: number = 10
): Promise<Recipe[]> {
  try {
    const allRecipes = await getRecipes({});
    
    // Score each recipe based on tag matches and weather context
    interface ScoredRecipe {
      recipe: Recipe;
      score: number;
    }
    
    const scoredRecipes: ScoredRecipe[] = allRecipes.map((recipe: Recipe) => ({
      recipe,
      score: calculateConfidence(recipe, selectedTags, ctx)
    }));
    
    // Sort by score and return top recipes
    return scoredRecipes
      .sort((a: ScoredRecipe, b: ScoredRecipe) => b.score - a.score)
      .slice(0, limit)
      .map((item: ScoredRecipe) => item.recipe);
      
  } catch (error) {
    console.error('Error finding matching recipes:', error);
    return [];
  }
}

/**
 * Get meal recommendations based on weather context
 */
export async function getMealRecommendations(
  ctx: WeatherContext,
  options: {
    count?: number;
    maxPrepTime?: number;
    excludeIngredients?: string[];
  } = {}
): Promise<MealRecommendation[]> {
  const { count = 3, maxPrepTime, excludeIngredients = [] } = options;
  
  try {
    // Get recommended tags based on weather
    const selectedTags = pickMealTags(ctx);
    
    // Find matching recipes
    let matchingRecipes = await findMatchingRecipes(selectedTags, ctx, count * 3);
    
    // Apply additional filters
    if (maxPrepTime) {
      matchingRecipes = matchingRecipes.filter(recipe => 
        !recipe.prepTime || recipe.prepTime <= maxPrepTime
      );
    }
    
    if (excludeIngredients.length > 0) {
      matchingRecipes = matchingRecipes.filter(recipe => 
        !excludeIngredients.some(ingredient => 
          recipe.ingredients.toLowerCase().includes(ingredient.toLowerCase())
        )
      );
    }
    
    // Generate recommendations with explanations
    const recommendations: MealRecommendation[] = matchingRecipes
      .slice(0, count)
      .map(recipe => ({
        recipe,
        reason: generateRecommendationReason(ctx, selectedTags),
        confidence: calculateConfidence(recipe, selectedTags, ctx),
        tags: selectedTags.filter(tag => 
          recipe.tags.some(recipeTag => 
            recipeTag.toLowerCase().includes(tag) || tag.includes(recipeTag.toLowerCase())
          )
        )
      }));
    
    return recommendations;
    
  } catch (error) {
    console.error('Error getting meal recommendations:', error);
    return [];
  }
}

/**
 * Get a quick explanation of current weather-based cooking conditions
 */
export function getWeatherSummary(ctx: WeatherContext): string {
  const { weather, sun, isWeeknight, season, month, date } = ctx;
  const seasonalInfo = getSeasonalInfo(season, month);
  
  // Get seasonal produce that's currently at peak
  const seasonalProduce = seasonalInfo.producePeak.slice(0, 2).join(' and ');
  
  // Build summary based on weather and season
  if (weather.feelsLike >= 85 && sun.minutesToSunset >= 90) {
    return `Perfect ${season} grilling weather with fresh ${seasonalProduce} in season!`;
  } else if (weather.feelsLike >= 85) {
    return `Too hot for cooking - perfect for ${season} no-cook meals with ${seasonalProduce}`;
  } else if (weather.precipitation >= 40) {
    return `Rainy ${season} day calls for warming comfort food`;
  } else if (weather.feelsLike <= 55) {
    return `Chilly ${season} weather - time for cozy dishes with ${seasonalProduce}`;
  } else if (isWeeknight) {
    return `Quick weeknight meals perfect for ${season} with seasonal ${seasonalProduce}`;
  } else {
    return `Beautiful ${season} weather for cooking with peak-season ${seasonalProduce}`;
  }
}

/**
 * Development helper: Get recommendations with detailed debugging info
 */
export async function getMealRecommendationsDebug(
  ctx: WeatherContext
): Promise<{
  recommendations: MealRecommendation[];
  selectedTags: MealTag[];
  weatherSummary: string;
  debugInfo: {
    temperature: number;
    conditions: string[];
    timeFactors: string[];
  };
}> {
  const selectedTags = pickMealTags(ctx);
  const recommendations = await getMealRecommendations(ctx);
  const weatherSummary = getWeatherSummary(ctx);
  
  const conditions: string[] = [];
  if (ctx.weather.feelsLike >= 85) conditions.push('hot');
  if (ctx.weather.feelsLike <= 55) conditions.push('cold');
  if (ctx.weather.precipitation >= 40) conditions.push('rainy');
  if (ctx.weather.windSpeed >= 20) conditions.push('windy');
  if (ctx.weather.aqi >= 100) conditions.push('poor air quality');
  
  const timeFactors: string[] = [];
  if (ctx.isWeeknight) timeFactors.push('weeknight');
  if (ctx.sun.minutesToSunset >= 90) timeFactors.push('golden hour');
  timeFactors.push(ctx.timeOfDay);
  
  return {
    recommendations,
    selectedTags,
    weatherSummary,
    debugInfo: {
      temperature: ctx.weather.feelsLike,
      conditions,
      timeFactors,
    }
  };
}