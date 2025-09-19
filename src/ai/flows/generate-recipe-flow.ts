'use server';

/**
 * @fileOverview An AI agent that generates a recipe from an image and a title using Vercel AI SDK.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const GenerateRecipeInputSchema = z.object({
    title: z.string().describe('The desired title for the recipe.'),
    photoDataUri: z
        .string()
        .describe(
        "A photo of the dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  ingredients: z.string().describe('The list of ingredients, with each on a new line.'),
  instructions: z.string().describe('The cooking instructions, with each step on a new line.'),
  tags: z.string().describe('A comma-separated list of relevant tags for the recipe (e.g., dinner, italian, pasta).'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4-vision-preview'),
      schema: GenerateRecipeOutputSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a creative chef who can figure out a recipe just by looking at a picture of a dish.
              Based on the provided image and title "${input.title}", generate a plausible recipe.

              Your task is to provide:
              - A list of ingredients (each on a new line)
              - Step-by-step instructions (each step on a new line)
              - A few descriptive tags (comma-separated string)

              Make the recipe realistic and achievable for home cooks.`
            },
            {
              type: 'image',
              image: input.photoDataUri
            }
          ]
        }
      ]
    });

    return object;
  } catch (error) {
    console.error('Error generating recipe:', error);
    // Fallback response
    return {
      ingredients: '2 cups all-purpose flour\n1 cup sugar\n2 eggs\n1/2 cup butter\n1 tsp vanilla',
      instructions: '1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Add wet ingredients\n4. Bake for 25-30 minutes',
      tags: 'dessert, baking, homemade'
    };
  }
}
