import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/recipes/favorites
 * Fetch all favorite recipes for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's favorite recipes
    const favorites = await prisma.favoriteRecipe.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        recipe: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Extract just the recipe objects
    const recipes = favorites.map((fav) => fav.recipe);

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching favorite recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite recipes' },
      { status: 500 }
    );
  }
}
