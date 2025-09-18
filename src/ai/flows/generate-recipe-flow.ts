'use server';

/**
 * @fileOverview An AI agent that generates a recipe from an image and a title.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return generateRecipeFlow(input);
}

const generateRecipePrompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `You are a creative chef who can figure out a recipe just by looking at a picture of a dish.
    Based on the provided image and title, generate a plausible recipe.

    Dish Title: {{{title}}}
    Photo: {{media url=photoDataUri}}

    Your task is to provide a list of ingredients, step-by-step instructions, and a few descriptive tags.
    Format the ingredients and instructions with each item on a new line.
    Format the tags as a single comma-separated string.
    `,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    const {output} = await generateRecipePrompt(input);
    return output!;
  }
);
