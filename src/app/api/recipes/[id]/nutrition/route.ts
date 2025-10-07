import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

/**
 * PATCH /api/recipes/[id]/nutrition
 * Update nutrition information for a recipe
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const {
      servingSize,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
    } = body;

    // Verify recipe exists and user owns it
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    if (recipe.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this recipe' },
        { status: 403 }
      );
    }

    // Validate nutrition values (must be non-negative if provided)
    if (calories !== undefined && calories !== null && calories < 0) {
      return NextResponse.json(
        { error: 'Calories must be non-negative' },
        { status: 400 }
      );
    }

    if (protein !== undefined && protein !== null && protein < 0) {
      return NextResponse.json(
        { error: 'Protein must be non-negative' },
        { status: 400 }
      );
    }

    if (carbs !== undefined && carbs !== null && carbs < 0) {
      return NextResponse.json(
        { error: 'Carbs must be non-negative' },
        { status: 400 }
      );
    }

    if (fat !== undefined && fat !== null && fat < 0) {
      return NextResponse.json(
        { error: 'Fat must be non-negative' },
        { status: 400 }
      );
    }

    if (fiber !== undefined && fiber !== null && fiber < 0) {
      return NextResponse.json(
        { error: 'Fiber must be non-negative' },
        { status: 400 }
      );
    }

    if (sugar !== undefined && sugar !== null && sugar < 0) {
      return NextResponse.json(
        { error: 'Sugar must be non-negative' },
        { status: 400 }
      );
    }

    if (sodium !== undefined && sodium !== null && sodium < 0) {
      return NextResponse.json(
        { error: 'Sodium must be non-negative' },
        { status: 400 }
      );
    }

    // Update recipe nutrition information
    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: {
        ...(servingSize !== undefined && { servingSize }),
        ...(calories !== undefined && { calories }),
        ...(protein !== undefined && { protein }),
        ...(carbs !== undefined && { carbs }),
        ...(fat !== undefined && { fat }),
        ...(fiber !== undefined && { fiber }),
        ...(sugar !== undefined && { sugar }),
        ...(sodium !== undefined && { sodium }),
      },
      select: {
        id: true,
        title: true,
        servingSize: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true,
        sodium: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedRecipe);
  } catch (error) {
    console.error('Error updating recipe nutrition:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe nutrition' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recipes/[id]/nutrition
 * Get nutrition information for a recipe
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        servingSize: true,
        servings: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true,
        sodium: true,
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe nutrition:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe nutrition' },
      { status: 500 }
    );
  }
}
