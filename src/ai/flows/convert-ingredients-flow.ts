'use server';

/**
 * @fileOverview An AI agent that converts a list of ingredients to a specified unit system using Vercel AI SDK.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const ConvertIngredientsInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A list of ingredients, with each ingredient on a new line.'),
  targetUnit: z
    .enum(['metric', 'imperial'])
    .describe('The target unit system to convert to.'),
});
export type ConvertIngredientsInput = z.infer<
  typeof ConvertIngredientsInputSchema
>;

const ConvertIngredientsOutputSchema = z.object({
  convertedIngredients: z
    .string()
    .describe('The converted list of ingredients, with each on a new line.'),
});
export type ConvertIngredientsOutput = z.infer<
  typeof ConvertIngredientsOutputSchema
>;

export async function convertIngredients(
  input: ConvertIngredientsInput
): Promise<ConvertIngredientsOutput> {
  try {
    const { object } = await generateObject({
      model: openai('gpt-3.5-turbo'),
      schema: ConvertIngredientsOutputSchema,
      prompt: `You are an expert recipe unit converter. Your task is to convert the given list of ingredients to the specified target unit system.

Target unit system: ${input.targetUnit}

Rules:
- Convert all relevant units (e.g., cups, ounces, pounds, teaspoons, tablespoons) to their ${input.targetUnit} equivalents
- For metric: use grams, milliliters, kilograms, etc.
- For imperial: use cups, ounces, pounds, teaspoons, tablespoons, etc.
- Maintain the original format of one ingredient per line
- If an ingredient has no unit to convert (e.g., "1 egg", "a pinch of salt"), keep it as is
- Round to reasonable precision for cooking (e.g., 250g not 249.86g)

Original Ingredients:
${input.ingredients}

Provide only the converted list of ingredients.`,
    });

    return object;
  } catch (error) {
    console.error('Error converting ingredients:', error);
    return { convertedIngredients: input.ingredients }; // Return original if conversion fails
  }
}
