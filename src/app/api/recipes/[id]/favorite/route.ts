import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/recipes/[id]/favorite
 * Toggle favorite status for a recipe
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const recipeId = params.id;
    const userId = session.user.id;

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.favoriteRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    let favorited: boolean;

    if (existingFavorite) {
      // Remove favorite
      await prisma.favoriteRecipe.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      favorited = false;
    } else {
      // Add favorite
      await prisma.favoriteRecipe.create({
        data: {
          userId,
          recipeId,
        },
      });
      favorited = true;
    }

    return NextResponse.json({ favorited });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
