import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createUserOpenAI } from '@/lib/openai-utils';

/**
 * Automatic Recipe Tagging Flow
 * Analyzes recipes and automatically generates relevant tags
 */

const AutoTagInputSchema = z.object({
  recipeName: z.string(),
  ingredients: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  cuisine: z.string().optional(),
  course: z.string().optional(),
  existingTags: z.array(z.string()).optional(),
});

export type AutoTagInput = z.infer<typeof AutoTagInputSchema>;

const AutoTagOutputSchema = z.object({
  tags: z.array(z.string()).describe('Relevant tags for the recipe'),
  suggestedCuisine: z.string().optional(),
  suggestedCourse: z.string().optional(),
  mealType: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert'])),
  dietaryLabels: z.array(z.string()).describe('e.g., vegetarian, vegan, gluten-free, dairy-free'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cookingMethod: z.array(z.string()).describe('e.g., baking, grilling, frying, slow-cooking'),
  prepTime: z.enum(['quick', 'medium', 'long']).optional(),
  nutritionProfile: z.array(z.string()).describe('e.g., high-protein, low-carb, balanced'),
  seasonality: z.array(z.string()).describe('e.g., summer, winter, fall, spring, year-round'),
  confidence: z.number().min(0).max(100),
});

export type AutoTagOutput = z.infer<typeof AutoTagOutputSchema>;

export async function autoTagRecipe(
  input: AutoTagInput,
  userId?: string
): Promise<AutoTagOutput> {
  try {
    const model = userId 
      ? (await createUserOpenAI(userId)) as any
      : openai('gpt-4-turbo');

    const prompt = buildAutoTagPrompt(input);

    const { object } = await generateObject({
      model,
      schema: AutoTagOutputSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert culinary analyst. Analyze recipes and generate comprehensive, accurate tags.
          
Your tags should be:
1. Descriptive - capture the essence of the recipe
2. Searchable - use common terms people search for
3. Accurate - based on ingredients and cooking method
4. Useful - help users find recipes by diet, occasion, season, etc.

Tag categories:
- Meal type: breakfast, lunch, dinner, snack, dessert
- Dietary: vegetarian, vegan, gluten-free, dairy-free, keto, paleo, etc.
- Cuisine: Italian, Mexican, Asian, American, etc.
- Cooking method: baked, grilled, fried, slow-cooked, no-cook, etc.
- Occasion: weeknight, party, holiday, romantic, kid-friendly, etc.
- Characteristics: healthy, comfort-food, quick, easy, make-ahead, etc.
- Season: summer, winter, spring, fall, year-round
- Nutrition: high-protein, low-carb, high-fiber, balanced, etc.

Be generous with tags but keep them relevant.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return object;
  } catch (error) {
    console.error('Error auto-tagging recipe:', error);
    
    // Fallback: basic tags based on name
    const fallbackTags = generateFallbackTags(input);
    return {
      tags: fallbackTags,
      mealType: ['dinner'],
      dietaryLabels: [],
      difficulty: 'medium',
      cookingMethod: [],
      nutritionProfile: [],
      seasonality: ['year-round'],
      confidence: 30,
    };
  }
}

function buildAutoTagPrompt(input: AutoTagInput): string {
  const parts: string[] = [`Recipe: ${input.recipeName}`];

  if (input.cuisine) {
    parts.push(`Cuisine: ${input.cuisine}`);
  }

  if (input.course) {
    parts.push(`Course: ${input.course}`);
  }

  if (input.ingredients && input.ingredients.length > 0) {
    parts.push(`\nIngredients:\n${input.ingredients.slice(0, 20).join('\n')}`);
  }

  if (input.instructions) {
    const truncated = input.instructions.length > 500
      ? `${input.instructions.substring(0, 500)}...`
      : input.instructions;
    parts.push(`\nInstructions:\n${truncated}`);
  }

  if (input.existingTags && input.existingTags.length > 0) {
    parts.push(`\nExisting tags (for reference): ${input.existingTags.join(', ')}`);
  }

  return parts.join('\n');
}

function generateFallbackTags(input: AutoTagInput): string[] {
  const tags: string[] = [];
  const name = input.recipeName.toLowerCase();

  // Basic keyword matching
  const keywords: Record<string, string[]> = {
    pasta: ['italian', 'pasta', 'comfort-food'],
    chicken: ['protein', 'poultry'],
    beef: ['protein', 'meat', 'hearty'],
    salad: ['healthy', 'fresh', 'light'],
    soup: ['comfort-food', 'warming', 'one-pot'],
    breakfast: ['breakfast', 'morning'],
    dessert: ['dessert', 'sweet'],
    quick: ['quick', 'easy'],
    grilled: ['grilled', 'bbq'],
    baked: ['baked', 'oven'],
  };

  Object.entries(keywords).forEach(([keyword, keywordTags]) => {
    if (name.includes(keyword)) {
      tags.push(...keywordTags);
    }
  });

  // Add existing tags
  if (input.existingTags) {
    tags.push(...input.existingTags);
  }

  // Remove duplicates
  return [...new Set(tags)];
}

/**
 * Batch auto-tag multiple recipes
 */
export async function batchAutoTag(
  recipes: AutoTagInput[],
  userId?: string,
  batchSize: number = 5
): Promise<Map<string, AutoTagOutput>> {
  const results = new Map<string, AutoTagOutput>();
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(recipe => autoTagRecipe(recipe, userId))
    );
    
    batch.forEach((recipe, index) => {
      results.set(recipe.recipeName, batchResults[index]);
    });
    
    // Small delay between batches
    if (i + batchSize < recipes.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Extract dietary labels from ingredients
 */
export function extractDietaryLabels(ingredients: string[]): string[] {
  const labels: Set<string> = new Set();
  const lowerIngredients = ingredients.map(i => i.toLowerCase());
  
  // Check for meat/animal products
  const hasMeat = lowerIngredients.some(i => 
    i.includes('chicken') || i.includes('beef') || i.includes('pork') || 
    i.includes('lamb') || i.includes('fish') || i.includes('turkey')
  );
  
  const hasDairy = lowerIngredients.some(i =>
    i.includes('milk') || i.includes('cheese') || i.includes('butter') ||
    i.includes('cream') || i.includes('yogurt')
  );
  
  const hasEggs = lowerIngredients.some(i => i.includes('egg'));
  
  const hasGluten = lowerIngredients.some(i =>
    i.includes('flour') || i.includes('bread') || i.includes('pasta') ||
    i.includes('wheat')
  );
  
  // Add labels
  if (!hasMeat && !hasDairy && !hasEggs) {
    labels.add('vegan');
    labels.add('vegetarian');
    labels.add('plant-based');
  } else if (!hasMeat) {
    labels.add('vegetarian');
  }
  
  if (!hasGluten) {
    labels.add('gluten-free');
  }
  
  if (!hasDairy) {
    labels.add('dairy-free');
  }
  
  return Array.from(labels);
}
