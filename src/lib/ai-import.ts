import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { GEMINI_MODEL_ID } from '@/lib/ai-config';

const TextRecipeSchema = z.object({
  title: z.string().describe('The recipe title'),
  summary: z.string().optional().describe('A short 1-2 sentence summary of the recipe'),
  ingredients: z.array(z.string()).describe('Ingredient lines, e.g. "1 cup flour"'),
  instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
  prepTime: z.number().optional().describe('Total time in minutes'),
  servings: z.number().optional().describe('Number of servings'),
  tags: z.array(z.string()).optional().describe('Descriptive tags, e.g. dinner, chicken, easy'),
  cuisine: z.string().optional().describe('Cuisine, e.g. American'),
  course: z.string().optional().describe('Course, e.g. Main'),
});

/**
 * Recipe shape shared with the manual import dialog (ParsedRecipe-compatible):
 * ingredients and instructions are plain strings.
 */
export interface TextImportedRecipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  totalTime?: number;
  servings?: number;
  tags: string[];
  cuisine: string;
  course: string;
}

/**
 * Extracts a structured recipe from unstructured text (social media caption,
 * webpage excerpt) using Gemini structured output.
 */
export async function parseRecipeFromText(text: string): Promise<TextImportedRecipe> {
  if (!text || text.trim().length === 0) {
    throw new Error('No text or URL provided.');
  }

  let object: z.infer<typeof TextRecipeSchema>;
  try {
    const result = await generateObject({
      model: google(GEMINI_MODEL_ID),
      schema: TextRecipeSchema,
      messages: [
        {
          role: 'user',
          content: `You are a culinary assistant helping format unstructured text (which might be a messy social media caption or a webpage excerpt) into a structured recipe.
Extract all recipe information you can find. If there is no recipe, return empty arrays.

Input Text:
${text}`,
        },
      ],
    });
    object = result.object;
  } catch (error) {
    console.error('Error parsing recipe with Gemini:', error);
    throw new Error('Failed to process recipe with AI.');
  }

  return {
    title: object.title || 'Imported AI Recipe',
    description: object.summary || '',
    ingredients: object.ingredients || [],
    instructions: object.instructions || [],
    totalTime: object.prepTime,
    servings: object.servings,
    tags: object.tags || [],
    cuisine: object.cuisine || '',
    course: object.course || '',
  };
}
