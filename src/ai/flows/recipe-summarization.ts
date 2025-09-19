'use server';

/**
 * @fileOverview A recipe summarization AI agent using Vercel AI SDK.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const SummarizeRecipeInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  ingredients: z.string().describe('The ingredients of the recipe.'),
  instructions: z.string().describe('The instructions of the recipe.'),
});
export type SummarizeRecipeInput = z.infer<typeof SummarizeRecipeInputSchema>;

const SummarizeRecipeOutputSchema = z.object({
  summary: z.string().describe('A short summary of the recipe.'),
});
export type SummarizeRecipeOutput = z.infer<typeof SummarizeRecipeOutputSchema>;

export async function summarizeRecipe(input: SummarizeRecipeInput): Promise<SummarizeRecipeOutput> {
  try {
    const { object } = await generateObject({
      model: openai('gpt-3.5-turbo'),
      schema: SummarizeRecipeOutputSchema,
      prompt: `You are an expert recipe summarizer. Please provide a concise summary of the recipe, highlighting its key aspects.

Recipe Name: ${input.recipeName}
Ingredients: ${input.ingredients}
Instructions: ${input.instructions}

Provide a summary that captures the essence of this recipe in 1-2 sentences.`,
    });

    return object;
  } catch (error) {
    console.error('Error summarizing recipe:', error);
    return { summary: 'A delicious family recipe.' };
  }
}
