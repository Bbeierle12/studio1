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

    if (!title || !photoDataUri) {
      return NextResponse.json(
        { error: 'Title and photo are required' },
        { status: 400 }
      );
    }

    // Generate recipe using AI
    const result = await generateRecipe({ title, photoDataUri });

    return NextResponse.json({
      ingredients: result.ingredients,
      instructions: result.instructions,
      tags: result.tags,
    });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}
