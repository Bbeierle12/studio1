import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateRecipe } from '@/ai/flows/generate-recipe-flow';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const photoDataUri = formData.get('photoDataUri') as string;
    
    // Optional context for better AI generation
    const prepTime = formData.get('prepTime') as string;
    const servings = formData.get('servings') as string;
    const course = formData.get('course') as string;
    const cuisine = formData.get('cuisine') as string;
    const difficulty = formData.get('difficulty') as string;
    const tags = formData.get('tags') as string;
    const story = formData.get('story') as string;

    if (!title || !photoDataUri) {
      return NextResponse.json(
        { error: 'Title and photo are required' },
        { status: 400 }
      );
    }

    // Build context string for AI
    let contextPrompt = `Recipe: ${title}`;
    if (servings) contextPrompt += `\nServings: ${servings}`;
    if (prepTime) contextPrompt += `\nPrep time: ${prepTime} minutes`;
    if (course) contextPrompt += `\nCourse: ${course}`;
    if (cuisine) contextPrompt += `\nCuisine: ${cuisine}`;
    if (difficulty) contextPrompt += `\nDifficulty: ${difficulty}`;
    if (tags) contextPrompt += `\nStyle/Tags: ${tags}`;
    if (story) contextPrompt += `\nSpecial notes: ${story}`;

    // Generate recipe using AI with enhanced context
    const result = await generateRecipe({ 
      title: contextPrompt, 
      photoDataUri 
    });

    return NextResponse.json({
      ingredients: result.ingredients,
      instructions: result.instructions,
      tags: result.tags,
      // Include context back if AI didn't override
      prepTime: prepTime || undefined,
      servings: servings || undefined,
      course: course || undefined,
      cuisine: cuisine || undefined,
      difficulty: difficulty || undefined,
    });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}
