import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { MealType } from '@prisma/client';

type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * POST /api/meal-plans/[id]/meals
 * Add a meal to a meal plan
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: mealPlanId } = params;
    const body = await request.json();

    // Verify meal plan ownership
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id: mealPlanId }
    });

    if (!mealPlan || mealPlan.userId !== userId) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    const { date, mealType, recipeId, customMealName, servings, notes, weatherAtPlanning } = body;

    // Validation
    if (!date || !mealType) {
      return NextResponse.json(
        { error: 'Date and mealType are required' },
        { status: 400 }
      );
    }

    if (!recipeId && !customMealName) {
      return NextResponse.json(
        { error: 'Either recipeId or customMealName is required' },
        { status: 400 }
      );
    }

    const meal = await prisma.plannedMeal.create({
      data: {
        mealPlanId,
        date: new Date(date),
        mealType: mealType as MealType,
        recipeId: recipeId || null,
        customMealName: customMealName || null,
        servings: servings || 4,
        notes: notes || null,
        weatherAtPlanning: weatherAtPlanning || null
      },
      include: {
        recipe: true
      }
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Error adding meal:', error);
    return NextResponse.json(
      { error: 'Failed to add meal' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/meal-plans/[id]/meals
 * Update a meal in a meal plan
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: mealPlanId } = params;
    const body = await request.json();

    const { mealId, ...updates } = body;

    if (!mealId) {
      return NextResponse.json({ error: 'mealId is required' }, { status: 400 });
    }

    // Verify ownership through meal plan
    const meal = await prisma.plannedMeal.findUnique({
      where: { id: mealId },
      include: {
        mealPlan: true
      }
    });

    if (!meal || meal.mealPlan.userId !== userId) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const updatedMeal = await prisma.plannedMeal.update({
      where: { id: mealId },
      data: {
        ...(updates.date && { date: new Date(updates.date) }),
        ...(updates.mealType && { mealType: updates.mealType as MealType }),
        ...(updates.recipeId !== undefined && { recipeId: updates.recipeId }),
        ...(updates.customMealName !== undefined && { customMealName: updates.customMealName }),
        ...(updates.servings !== undefined && { servings: updates.servings }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.isCompleted !== undefined && { isCompleted: updates.isCompleted }),
        ...(updates.weatherAtPlanning !== undefined && { weatherAtPlanning: updates.weatherAtPlanning })
      },
      include: {
        recipe: true
      }
    });

    return NextResponse.json(updatedMeal);
  } catch (error) {
    console.error('Error updating meal:', error);
    return NextResponse.json(
      { error: 'Failed to update meal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meal-plans/[id]/meals
 * Delete a meal from a meal plan
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get('mealId');

    if (!mealId) {
      return NextResponse.json({ error: 'mealId is required' }, { status: 400 });
    }

    // Verify ownership
    const meal = await prisma.plannedMeal.findUnique({
      where: { id: mealId },
      include: {
        mealPlan: true
      }
    });

    if (!meal || meal.mealPlan.userId !== userId) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    await prisma.plannedMeal.delete({
      where: { id: mealId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json(
      { error: 'Failed to delete meal' },
      { status: 500 }
    );
  }
}
