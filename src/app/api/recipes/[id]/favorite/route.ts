import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/recipes/[id]/favorite
 * Toggle favorite status for a recipe
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const recipeId = (await params).id;
    const userId = session.user.id;

    // Check the recipe exists and the caller owns it (else 404 — no cross-tenant favoriting).
    // TODO(household): widen scope to household members once membership is wired
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, userId },
      select: { id: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Toggle atomically so concurrent POSTs (double-tap/retry) don't 500 on the
    // @@unique([userId, recipeId]) constraint.
    const removed = await prisma.favoriteRecipe.deleteMany({
      where: { userId, recipeId },
    });

    let favorited: boolean;

    if (removed.count > 0) {
      // A favorite existed and was removed.
      favorited = false;
    } else {
      // No favorite existed — create one, tolerating a concurrent create (P2002).
      try {
        await prisma.favoriteRecipe.create({
          data: {
            userId,
            recipeId,
          },
        });
      } catch (error) {
        if (
          !(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          )
        ) {
          throw error;
        }
        // A concurrent request already created it — treat as favorited (idempotent).
      }
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
