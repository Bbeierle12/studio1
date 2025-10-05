import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

type RouteContext = {
  params: {
    id: string;
  };
};

/**
 * GET /api/meal-plans/[id]
 * Get a specific meal plan with all meals
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    const mealPlan = await prisma.mealPlan.findUnique({
      where: {
        id,
        userId
      },
      include: {
        meals: {
          include: {
            recipe: true
          },
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (!mealPlan) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plan' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/meal-plans/[id]
 * Update a meal plan
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.mealPlan.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // If setting this plan as active, deactivate others
    if (body.isActive === true) {
      await prisma.mealPlan.updateMany({
        where: {
          userId,
          id: { not: id },
          isActive: true
        },
        data: {
          isActive: false
        }
      });
    }

    const mealPlan = await prisma.mealPlan.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      },
      include: {
        meals: {
          include: {
            recipe: true
          }
        }
      }
    });

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to update meal plan' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meal-plans/[id]
 * Delete a meal plan
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    // Verify ownership
    const existing = await prisma.mealPlan.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    await prisma.mealPlan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete meal plan' },
      { status: 500 }
    );
  }
}
