import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { calculateTotalNutrition, calculateWeeklyAverage } from '@/lib/nutrition-calculator';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';

/**
 * GET /api/nutrition/weekly-summary?startDate={startDate}
 * Get nutrition summary for a week (7 days)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');

    if (!startDateParam) {
      return NextResponse.json(
        { error: 'startDate parameter is required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const weekStart = startOfDay(startDate);
    const weekEnd = endOfDay(addDays(startDate, 6));

    // Get all meal plans for the user
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: weekEnd },
        OR: [
          { endDate: { gte: weekStart } },
          { endDate: null },
        ],
      },
      include: {
        meals: {
          where: {
            date: {
              gte: weekStart,
              lte: weekEnd,
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

    // Group meals by date
    const dailyNutrition = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const dayMeals = allMeals.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= dayStart && mealDate <= dayEnd;
      });

      const mealsWithNutrition = dayMeals.map(meal => ({
        servings: meal.servings,
        recipe: meal.recipe,
      }));

      const nutrition = calculateTotalNutrition(mealsWithNutrition);

      dailyNutrition.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        nutrition,
        mealsCount: dayMeals.length,
      });
    }

    // Calculate weekly average
    const weeklyAverage = calculateWeeklyAverage(
      dailyNutrition.map(d => d.nutrition)
    );

    // Get active nutrition goal
    const activeGoal = await prisma.nutritionGoal.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        startDate: { lte: weekEnd },
        OR: [
          { endDate: { gte: weekStart } },
          { endDate: null },
        ],
      },
    });

    // Calculate weekly totals
    const weeklyTotal = dailyNutrition.reduce(
      (acc, day) => ({
        calories: acc.calories + day.nutrition.calories,
        protein: acc.protein + day.nutrition.protein,
        carbs: acc.carbs + day.nutrition.carbs,
        fat: acc.fat + day.nutrition.fat,
        fiber: acc.fiber + day.nutrition.fiber,
        sugar: acc.sugar + day.nutrition.sugar,
        sodium: acc.sodium + day.nutrition.sodium,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      }
    );

    return NextResponse.json({
      startDate: startDateParam,
      endDate: format(addDays(startDate, 6), 'yyyy-MM-dd'),
      dailyNutrition,
      weeklyAverage,
      weeklyTotal,
      goal: activeGoal,
      daysWithData: dailyNutrition.filter(d => d.mealsCount > 0).length,
    });
  } catch (error) {
    console.error('Error fetching weekly nutrition summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly nutrition summary' },
      { status: 500 }
    );
  }
}
