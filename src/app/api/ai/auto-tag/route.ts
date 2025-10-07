import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { autoTagRecipe, batchAutoTag } from '@/ai/flows/auto-tag-flow';
import { prisma } from '@/lib/data';

/**
 * POST /api/ai/auto-tag
 * Automatically generate tags for a recipe
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { recipeId, recipeName, ingredients, instructions, cuisine, course, existingTags } = body;

    let recipeData;
    if (recipeId) {
      // Fetch recipe from database
      const recipe = await prisma.recipe.findUnique({
        where: { id: recipeId, userId: user.id },
      });

      if (!recipe) {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }

      recipeData = {
        recipeName: recipe.title,
        ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients as string) : [],
        instructions: recipe.instructions || undefined,
        cuisine: recipe.cuisine || undefined,
        course: recipe.course || undefined,
        existingTags: recipe.tags ? JSON.parse(recipe.tags as string) : [],
      };
    } else {
      // Use provided data
      recipeData = {
        recipeName,
        ingredients,
        instructions,
        cuisine,
        course,
        existingTags,
      };
    }

    // Generate tags
    const result = await autoTagRecipe(recipeData, user.id);

    // If recipeId provided, optionally update the recipe
    const { autoApply = false } = body;
    if (recipeId && autoApply) {
      await prisma.recipe.update({
        where: { id: recipeId },
        data: {
          tags: JSON.stringify(result.tags),
          cuisine: result.suggestedCuisine || undefined,
          course: result.suggestedCourse || undefined,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error auto-tagging recipe:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai/auto-tag
 * Batch auto-tag multiple recipes
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { recipeIds, autoApply = false } = body;

    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json(
        { error: 'recipeIds array is required' },
        { status: 400 }
      );
    }

    // Fetch recipes
    const recipes = await prisma.recipe.findMany({
      where: {
        id: { in: recipeIds },
        userId: user.id,
      },
    });

    // Prepare input for batch tagging
    const recipesInput = recipes.map((recipe: any) => ({
      recipeName: recipe.title,
      ingredients: recipe.ingredients ? JSON.parse(recipe.ingredients as string) : [],
      instructions: recipe.instructions || undefined,
      cuisine: recipe.cuisine || undefined,
      course: recipe.course || undefined,
      existingTags: recipe.tags ? JSON.parse(recipe.tags as string) : [],
    }));

    // Batch auto-tag
    const results = await batchAutoTag(recipesInput, user.id);

    // Apply tags if requested
    if (autoApply) {
      const updates = recipes.map((recipe: any, _index: number) => {
        const tagResult = results.get(recipe.title);
        if (!tagResult) return null;

        return prisma.recipe.update({
          where: { id: recipe.id },
          data: {
            tags: JSON.stringify(tagResult.tags),
            cuisine: tagResult.suggestedCuisine || recipe.cuisine,
            course: tagResult.suggestedCourse || recipe.course,
          },
        });
      }).filter(Boolean);

      await Promise.all(updates);
    }

    // Convert Map to object for JSON response
    const resultsArray = Array.from(results.entries()).map(([name, tags]) => ({
      recipeName: name,
      ...tags,
    }));

    return NextResponse.json({
      success: true,
      results: resultsArray,
      count: resultsArray.length,
    });
  } catch (error) {
    console.error('Error batch auto-tagging:', error);
    return NextResponse.json(
      { error: 'Failed to batch tag recipes' },
      { status: 500 }
    );
  }
}
