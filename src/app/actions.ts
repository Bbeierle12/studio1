'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { addRecipe as saveRecipe, updateRecipe, deleteRecipe, getRecipeById } from '@/lib/data';
import { summarizeRecipe } from '@/ai/flows/recipe-summarization';
import { generateRecipe } from '@/ai/flows/generate-recipe-flow';
import { recipeSchema, generatedRecipeSchema } from '@/lib/schemas';
import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

async function getUserId() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      return null;
    }
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}


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
  
  const userId = await getUserId();
  if (!userId) {
    return { message: 'You must be logged in to add a recipe.' };
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
      imageHint: 'food meal',
      userId
    });

  } catch (error) {
    console.error('Error adding recipe:', error);
    return { message: 'Failed to add recipe. An unexpected error occurred.' };
  }

  revalidatePath('/');
  revalidatePath('/recipes');
  redirect('/');
}

export async function updateRecipeAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = recipeSchema.safeParse({
    id: formData.get('id'),
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

  const { id, title, contributor, ingredients, instructions, tags } = validatedFields.data;

  if (!id) {
    return { message: 'Recipe ID is missing.' };
  }
  
  const userId = await getUserId();
  const recipeToUpdate = await getRecipeById(id);

  if (recipeToUpdate && recipeToUpdate.userId && recipeToUpdate.userId !== userId) {
      return { message: 'You do not have permission to edit this recipe.' };
  }


  try {
    const summaryResult = await summarizeRecipe({
        recipeName: title,
        ingredients: ingredients,
        instructions: instructions,
    });
    
    const tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase());

    await updateRecipe({
      id,
      title,
      contributor,
      ingredients,
      instructions,
      tags: tagsArray,
      summary: summaryResult.summary,
      imageUrl: `https://picsum.photos/seed/${title.replace(/\s+/g, '-')}/600/400`,
      imageHint: 'food meal',
      userId: recipeToUpdate?.userId || userId
    });

  } catch (error) {
    console.error('Error updating recipe:', error);
    return { message: 'Failed to update recipe. An unexpected error occurred.' };
  }

  revalidatePath(`/recipes/${id}`);
  revalidatePath('/recipes');
  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(id: string) {
    const userId = await getUserId();
    const recipeToDelete = await getRecipeById(id);

    if (recipeToDelete && recipeToDelete.userId && recipeToDelete.userId !== userId) {
      return { message: 'You do not have permission to delete this recipe.' };
    }

    try {
        await deleteRecipe(id);
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return { message: 'Failed to delete recipe. An unexpected error occurred.' };
    }

    revalidatePath('/recipes');
    redirect('/recipes');
}

export async function generateRecipeAction(formData: FormData) {
  const validatedFields = generatedRecipeSchema.safeParse({
    title: formData.get('title'),
    photoDataUri: formData.get('photoDataUri'),
  });

  if (!validatedFields.success) {
    // This case should ideally be handled by client-side validation
    console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
    redirect('/recipes/generate?error=validation');
    return;
  }

  try {
    const { title, photoDataUri } = validatedFields.data;
    const result = await generateRecipe({ title, photoDataUri });

    const queryParams = new URLSearchParams({
      title,
      ingredients: result.ingredients,
      instructions: result.instructions,
      tags: result.tags,
      fromAI: 'true'
    });
    
    redirect(`/recipes/new?${queryParams.toString()}`);
  } catch (error) {
    console.error('Error generating recipe with AI:', error);
    redirect('/recipes/generate?error=ai_failed');
  }
}


export async function createSession(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
  revalidatePath('/');
}

export async function clearSession() {
    cookies().delete('session');
    revalidatePath('/');
}