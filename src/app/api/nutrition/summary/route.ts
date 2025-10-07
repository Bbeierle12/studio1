import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { calculateTotalNutrition } from '@/lib/nutrition-calculator';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/nutrition/summary?date={date}
 * Get nutrition summary for a specific date
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get all meal plans for the user
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: dayEnd },
        OR: [
          { endDate: { gte: dayStart } },
          { endDate: null },
        ],
      },
      include: {
        meals: {
          where: {
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          include: {
            recipe: {
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
              },
            },
          },
        },
      },
    });

    // Flatten all meals from all meal plans
    const allMeals = mealPlans.flatMap(plan => plan.meals);

    // Calculate total nutrition
    const mealsWithNutrition = allMeals.map(meal => ({
      servings: meal.servings,
      recipe: meal.recipe,
    }));

    const totalNutrition = calculateTotalNutrition(mealsWithNutrition);

    // Get active nutrition goal
    const activeGoal = await prisma.nutritionGoal.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: date },
        OR: [
          { endDate: { gte: date } },
          { endDate: null },
        ],
      },
    });

    // Group meals by meal type for detailed breakdown
    const mealsByType = {
      BREAKFAST: allMeals.filter(m => m.mealType === 'BREAKFAST'),
      LUNCH: allMeals.filter(m => m.mealType === 'LUNCH'),
      DINNER: allMeals.filter(m => m.mealType === 'DINNER'),
      SNACK: allMeals.filter(m => m.mealType === 'SNACK'),
    };

    const breakdown = Object.entries(mealsByType).map(([mealType, meals]) => {
      const mealsWithNutrition = meals.map(meal => ({
        servings: meal.servings,
        recipe: meal.recipe,
      }));

      const nutrition = calculateTotalNutrition(mealsWithNutrition);

      return {
        mealType,
        mealsCount: meals.length,
        nutrition,
        meals: meals.map(meal => ({
          id: meal.id,
          recipeName: meal.recipe?.title || meal.customMealName || 'Unknown',
          servings: meal.servings,
          nutrition: meal.recipe ? {
            calories: (meal.recipe.calories || 0) * meal.servings,
            protein: (meal.recipe.protein || 0) * meal.servings,
            carbs: (meal.recipe.carbs || 0) * meal.servings,
            fat: (meal.recipe.fat || 0) * meal.servings,
            fiber: (meal.recipe.fiber || 0) * meal.servings,
            sugar: (meal.recipe.sugar || 0) * meal.servings,
            sodium: (meal.recipe.sodium || 0) * meal.servings,
          } : null,
        })),
      };
    });

    return NextResponse.json({
      date: dateParam,
      totalNutrition,
      goal: activeGoal,
      breakdown,
    });
  } catch (error) {
    console.error('Error fetching nutrition summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition summary' },
      { status: 500 }
    );
  }
}
