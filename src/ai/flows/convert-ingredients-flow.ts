'use server';

/**
 * @fileOverview An AI agent that converts a list of ingredients to a specified unit system.
 *
 * - convertIngredients - A function that handles the ingredient conversion process.
 * - ConvertIngredientsInput - The input type for the convertIngredients function.
 * - ConvertIngredientsOutput - The return type for the convertIngredients function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConvertIngredientsInputSchema = z.object({
  ingredients: z.string().describe('A list of ingredients, with each ingredient on a new line.'),
  targetUnit: z.enum(['metric', 'imperial']).describe('The target unit system to convert to.'),
});
export type ConvertIngredientsInput = z.infer<typeof ConvertIngredientsInputSchema>;

const ConvertIngredientsOutputSchema = z.object({
  convertedIngredients: z.string().describe('The converted list of ingredients, with each on a new line.'),
});
export type ConvertIngredientsOutput = z.infer<typeof ConvertIngredientsOutputSchema>;

export async function convertIngredients(input: ConvertIngredientsInput): Promise<ConvertIngredientsOutput> {
  return convertIngredientsFlow(input);
}

const convertIngredientsPrompt = ai.definePrompt({
  name: 'convertIngredientsPrompt',
  input: { schema: ConvertIngredientsInputSchema },
  output: { schema: ConvertIngredientsOutputSchema },
  prompt: `You are an expert recipe unit converter. Your task is to convert the given list of ingredients to the specified target unit system.

- Convert all relevant units (e.g., cups, ounces, pounds, teaspoons, tablespoons) to their {{{targetUnit}}} equivalents (e.g., grams, milliliters, kilograms).
- Maintain the original format of one ingredient per line.
- If an ingredient has no unit to convert (e.g., "1 egg", "a pinch of salt"), keep it as is.
- Provide only the converted list of ingredients in your response.

Original Ingredients:
{{{ingredients}}}
`,
});

const convertIngredientsFlow = ai.defineFlow(
  {
    name: 'convertIngredientsFlow',
    inputSchema: ConvertIngredientsInputSchema,
    outputSchema: ConvertIngredientsOutputSchema,
  },
  async input => {
    const { output } = await convertIngredientsPrompt(input);
    return output!;
  }
);
