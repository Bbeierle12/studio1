import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseNaturalLanguageCommand, generateMealPlan, parseRelativeDate } from '@/ai/flows/nlp-meal-planning-flow';
import { prisma } from '@/lib/data';

/**
 * POST /api/ai/nlp-plan
 * Parse natural language commands and execute meal planning actions
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
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    const currentDate = new Date().toISOString();

    // Parse the natural language command
    const parsed = await parseNaturalLanguageCommand(
      {
        command,
        currentDate,
      },
      user.id
    );

    // If clarification is needed, return the question
    if (parsed.clarificationNeeded) {
      return NextResponse.json({
        success: false,
        clarificationNeeded: true,
        question: parsed.clarificationQuestion,
        parsed,
      });
    }

    // Execute the actions
    const results = await executeActions(user.id, parsed.actions);

    return NextResponse.json({
      success: true,
      intent: parsed.intent,
      actions: parsed.actions,
      results,
      parsed,
    });
  } catch (error) {
    console.error('Error processing NLP command:', error);
    return NextResponse.json(
      { error: 'Failed to process command' },
      { status: 500 }
    );
  }
}

async function executeActions(userId: string, actions: any[]) {
  const results = [];

  for (const action of actions) {
    try {
      if (action.action === 'add' && action.recipeName) {
        // Find recipe by title (fuzzy search)
        const recipe = await prisma.recipe.findFirst({
          where: {
            userId,
            title: {
              contains: action.recipeName,
              mode: 'insensitive',
            },
          },
        });

        if (recipe) {
          // Find or create active meal plan
          let mealPlan = await prisma.mealPlan.findFirst({
            where: {
              userId,
              isActive: true,
            },
          });

          if (!mealPlan) {
            mealPlan = await prisma.mealPlan.create({
              data: {
                userId,
                name: 'Default Meal Plan',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                isActive: true,
              },
            });
          }

          // Create planned meal
          const plannedMeal = await prisma.plannedMeal.create({
            data: {
              mealPlanId: mealPlan.id,
              recipeId: recipe.id,
              date: new Date(action.date),
              mealType: action.mealType,
            },
          });

          results.push({
            action: 'add',
            success: true,
            meal: plannedMeal,
          });
        } else {
          results.push({
            action: 'add',
            success: false,
            error: `Recipe "${action.recipeName}" not found`,
          });
        }
      } else if (action.action === 'remove') {
        // Remove planned meal - first get the active meal plan
        const activePlan = await prisma.mealPlan.findFirst({
          where: {
            userId,
            isActive: true,
          },
        });

        if (activePlan) {
          const deleted = await prisma.plannedMeal.deleteMany({
            where: {
              mealPlanId: activePlan.id,
              date: new Date(action.date),
              mealType: action.mealType,
            },
          });

          results.push({
            action: 'remove',
            success: true,
            deletedCount: deleted.count,
          });
        } else {
          results.push({
            action: 'remove',
            success: false,
            error: 'No active meal plan found',
          });
        }
      }
    } catch (error) {
      console.error('Error executing action:', error);
      results.push({
        action: action.action,
        success: false,
        error: 'Failed to execute action',
      });
    }
  }

  return results;
}

/**
 * POST /api/ai/generate-plan
 * Generate a complete meal plan for a period
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
    const {
      startDate,
      endDate,
      mealTypes = ['breakfast', 'lunch', 'dinner'],
      dietaryConstraints,
      calorieTarget,
      cuisinePreferences,
      variety = 'medium',
    } = body;

    // Generate meal plan
    const plan = await generateMealPlan(
      {
        startDate,
        endDate,
        mealTypes,
        dietaryConstraints,
        calorieTarget,
        cuisinePreferences,
        variety,
      },
      user.id
    );

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
