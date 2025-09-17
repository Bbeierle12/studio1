'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { addRecipe as saveRecipe } from '@/lib/data';
import { summarizeRecipe } from '@/ai/flows/recipe-summarization';

export const recipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  contributor: z.string().min(1, 'Please select a contributor.'),
  ingredients: z.string().min(10, 'Ingredients list is too short.'),
  instructions: z.string().min(20, 'Instructions are too short.'),
  tags: z.string().min(1, 'Please add at least one tag.'),
});

export type FormState = {
  message: string;
  errors?: {
    title?: string[];
    contributor?: string[];
    ingredients?: string[];
    instructions?: string[];
    tags?: string[];
  };
};

export async function addRecipeAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = recipeSchema.safeParse({
    title: formData.get('title'),
    contributor: formData.get('contributor'),
    ingredients: formData.get('ingredients'),
    instructions: formData.get('instructions'),
    tags: formData.get('tags'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check your input.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, contributor, ingredients, instructions, tags } = validatedFields.data;

  try {
    const summaryResult = await summarizeRecipe({
        recipeName: title,
        ingredients: ingredients,
        instructions: instructions,
    });
    
    const tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase());

    const newRecipe = await saveRecipe({
      title,
      contributor,
      ingredients,
      instructions,
      tags: tagsArray,
      summary: summaryResult.summary,
      imageUrl: `https://picsum.photos/seed/${title.replace(/\s+/g, '-')}/600/400`,
      imageHint: 'food meal'
    });

  } catch (error) {
    console.error('Error adding recipe:', error);
    return { message: 'Failed to add recipe. An unexpected error occurred.' };
  }

  revalidatePath('/');
  revalidatePath('/recipes');
  redirect('/');
}
