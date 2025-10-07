import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createUserOpenAI } from '@/lib/openai-utils';

/**
 * Smart Meal Suggestions Flow
 * Analyzes user preferences, past meals, weather, and dietary restrictions
 * to suggest meals for specific days
 */

const MealSuggestionInputSchema = z.object({
  date: z.string().describe('The date to suggest meals for (ISO format)'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  weather: z.object({
    temperature: z.number(),
    condition: z.string(),
    season: z.string(),
  }).optional(),
  userPreferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    dislikedIngredients: z.array(z.string()).optional(),
    preferredCuisines: z.array(z.string()).optional(),
    calorieTarget: z.number().optional(),
  }).optional(),
  recentMeals: z.array(z.object({
    name: z.string(),
    cuisine: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })).optional(),
});

export type MealSuggestionInput = z.infer<typeof MealSuggestionInputSchema>;

const MealSuggestionOutputSchema = z.object({
  suggestions: z.array(z.object({
    recipeName: z.string(),
    reason: z.string(),
    cuisineType: z.string(),
    estimatedCalories: z.number().optional(),
    tags: z.array(z.string()),
    confidenceScore: z.number().min(0).max(100),
  })),
  reasoning: z.string(),
});

export type MealSuggestionOutput = z.infer<typeof MealSuggestionOutputSchema>;

export async function generateMealSuggestions(
  input: MealSuggestionInput,
  userId?: string
): Promise<MealSuggestionOutput> {
  try {
    // Use user-specific OpenAI key if available
    const model = userId 
      ? (await createUserOpenAI(userId)) as any
      : openai('gpt-4-turbo');

    const prompt = buildSuggestionPrompt(input);

    const { object } = await generateObject({
      model,
      schema: MealSuggestionOutputSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert meal planning assistant with knowledge of nutrition, cuisine, and seasonal cooking. 
          Your job is to suggest meals that are:
          1. Appropriate for the weather and season
          2. Aligned with user preferences and dietary restrictions
          3. Varied from recent meals to avoid repetition
          4. Nutritionally balanced
          5. Practical for home cooking
          
          Provide 3-5 diverse suggestions with clear reasoning.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return object;
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    
    // Fallback suggestions
    return {
      suggestions: [
        {
          recipeName: 'Seasonal Salad',
          reason: 'Light and fresh option appropriate for any weather',
          cuisineType: 'American',
          estimatedCalories: 350,
          tags: ['healthy', 'quick', 'vegetarian'],
          confidenceScore: 70,
        },
        {
          recipeName: 'Grilled Chicken with Vegetables',
          reason: 'Balanced protein and vegetables',
          cuisineType: 'American',
          estimatedCalories: 450,
          tags: ['healthy', 'protein', 'balanced'],
          confidenceScore: 75,
        },
        {
          recipeName: 'Pasta Primavera',
          reason: 'Versatile and satisfying',
          cuisineType: 'Italian',
          estimatedCalories: 550,
          tags: ['pasta', 'vegetables', 'comfort'],
          confidenceScore: 70,
        },
      ],
      reasoning: 'Providing balanced fallback suggestions due to API unavailability.',
    };
  }
}

function buildSuggestionPrompt(input: MealSuggestionInput): string {
  const parts: string[] = [];

  parts.push(`Suggest meals for ${input.date}${input.mealType ? ` (${input.mealType})` : ''}`);

  if (input.weather) {
    parts.push(`\n\nWeather context:
    - Temperature: ${input.weather.temperature}°F
    - Condition: ${input.weather.condition}
    - Season: ${input.weather.season}`);
  }

  if (input.userPreferences) {
    const prefs = input.userPreferences;
    parts.push('\n\nUser preferences:');
    
    if (prefs.dietaryRestrictions && prefs.dietaryRestrictions.length > 0) {
      parts.push(`- Dietary restrictions: ${prefs.dietaryRestrictions.join(', ')}`);
    }
    if (prefs.dislikedIngredients && prefs.dislikedIngredients.length > 0) {
      parts.push(`- Avoid ingredients: ${prefs.dislikedIngredients.join(', ')}`);
    }
    if (prefs.preferredCuisines && prefs.preferredCuisines.length > 0) {
      parts.push(`- Preferred cuisines: ${prefs.preferredCuisines.join(', ')}`);
    }
    if (prefs.calorieTarget) {
      parts.push(`- Target calories per meal: ~${prefs.calorieTarget} kcal`);
    }
  }

  if (input.recentMeals && input.recentMeals.length > 0) {
    parts.push('\n\nRecent meals (avoid suggesting similar):');
    input.recentMeals.forEach((meal, i) => {
      parts.push(`${i + 1}. ${meal.name}${meal.cuisine ? ` (${meal.cuisine})` : ''}`);
    });
  }

  return parts.join('\n');
}

/**
 * Analyze user meal history to learn preferences
 */
export async function analyzeUserPreferences(
  userId: string,
  mealHistory: Array<{
    recipeName: string;
    cuisine?: string;
    tags?: string[];
    rating?: number;
    date: Date;
  }>
): Promise<{
  preferredCuisines: string[];
  preferredTags: string[];
  mealFrequency: { breakfast: number; lunch: number; dinner: number; snack: number };
  diversityScore: number;
}> {
  // Calculate cuisine preferences
  const cuisineCount = new Map<string, number>();
  mealHistory.forEach(meal => {
    if (meal.cuisine) {
      cuisineCount.set(meal.cuisine, (cuisineCount.get(meal.cuisine) || 0) + 1);
    }
  });
  
  const preferredCuisines = Array.from(cuisineCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cuisine]) => cuisine);

  // Calculate tag preferences
  const tagCount = new Map<string, number>();
  mealHistory.forEach(meal => {
    meal.tags?.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });
  
  const preferredTags = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Calculate meal frequency (placeholder - would need meal type data)
  const mealFrequency = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };

  // Calculate diversity score (unique recipes / total meals)
  const uniqueRecipes = new Set(mealHistory.map(m => m.recipeName)).size;
  const diversityScore = mealHistory.length > 0 
    ? Math.round((uniqueRecipes / mealHistory.length) * 100)
    : 0;

  return {
    preferredCuisines,
    preferredTags,
    mealFrequency,
    diversityScore,
  };
}
