import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

/**
 * GET /api/nutrition/goals
 * Get user's nutrition goals
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {
      userId: session.user.id,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const goals = await prisma.nutritionGoal.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { startDate: 'desc' },
      ],
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching nutrition goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nutrition goals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nutrition/goals
 * Create a new nutrition goal
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetFiber,
      startDate,
      endDate,
      isActive = true,
      deactivateOthers = true,
    } = body;

    // Validate required fields
    if (!targetCalories || targetCalories <= 0) {
      return NextResponse.json(
        { error: 'Target calories is required and must be positive' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // If deactivateOthers is true and this goal is active, deactivate all other goals
    if (deactivateOthers && isActive) {
      await prisma.nutritionGoal.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Create the new goal
    const goal = await prisma.nutritionGoal.create({
      data: {
        userId: session.user.id,
        name,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        targetFiber,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating nutrition goal:', error);
    return NextResponse.json(
      { error: 'Failed to create nutrition goal' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/nutrition/goals
 * Update a nutrition goal
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetFiber,
      startDate,
      endDate,
      isActive,
      deactivateOthers = false,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingGoal = await prisma.nutritionGoal.findUnique({
      where: { id },
    });

    if (!existingGoal || existingGoal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nutrition goal not found' },
        { status: 404 }
      );
    }

    // If activating this goal and deactivateOthers is true, deactivate all other goals
    if (deactivateOthers && isActive && !existingGoal.isActive) {
      await prisma.nutritionGoal.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
          id: { not: id },
        },
        data: {
          isActive: false,
        },
      });
    }

    // Update the goal
    const updatedGoal = await prisma.nutritionGoal.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(targetCalories !== undefined && { targetCalories }),
        ...(targetProtein !== undefined && { targetProtein }),
        ...(targetCarbs !== undefined && { targetCarbs }),
        ...(targetFat !== undefined && { targetFat }),
        ...(targetFiber !== undefined && { targetFiber }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating nutrition goal:', error);
    return NextResponse.json(
      { error: 'Failed to update nutrition goal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nutrition/goals
 * Delete a nutrition goal
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingGoal = await prisma.nutritionGoal.findUnique({
      where: { id },
    });

    if (!existingGoal || existingGoal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nutrition goal not found' },
        { status: 404 }
      );
    }

    // Delete the goal
    await prisma.nutritionGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nutrition goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete nutrition goal' },
      { status: 500 }
    );
  }
}
