import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateMealSuggestions } from '@/ai/flows/meal-suggestion-flow';
import { prisma } from '@/lib/data';

/**
 * POST /api/ai/suggest-meals
 * Generate AI-powered meal suggestions based on context
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
    const {
      date,
      mealType,
      weather,
      includePreferences = true,
      includeHistory = true,
    } = body;

    // Fetch user preferences from database
    let userPreferences;
    if (includePreferences) {
      const nutritionGoal = await prisma.nutritionGoal.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      userPreferences = {
        calorieTarget: nutritionGoal?.targetCalories,
        // Add more preferences as needed
      };
    }

    // Fetch recent meal history
    let recentMeals;
    if (includeHistory) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const plannedMeals = await prisma.plannedMeal.findMany({
        where: {
          mealPlan: {
            userId: user.id,
          },
          date: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          recipe: {
            select: {
              title: true,
              cuisine: true,
              tags: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 20,
      });

      recentMeals = plannedMeals.map((pm: any) => ({
        name: pm.recipe?.title || pm.customMealName || 'Unknown',
        cuisine: pm.recipe?.cuisine || undefined,
        tags: pm.recipe?.tags ? JSON.parse(pm.recipe.tags as string) : undefined,
      }));
    }

    // Generate suggestions using AI
    const suggestions = await generateMealSuggestions(
      {
        date,
        mealType,
        weather,
        userPreferences,
        recentMeals,
      },
      user.id
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
