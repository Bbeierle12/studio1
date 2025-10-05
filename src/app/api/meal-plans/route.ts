import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

/**
 * GET /api/meal-plans
 * List all meal plans for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');
    
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId,
        ...(isActive !== null && { isActive: isActive === 'true' })
      },
      include: {
        meals: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                prepTime: true,
                servings: true
              }
            }
          },
          orderBy: {
            date: 'asc'
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meal-plans
 * Create a new meal plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const { name, startDate, endDate } = body;

    // Validation
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Deactivate other meal plans if this is being set as active
    if (body.isActive !== false) {
      await prisma.mealPlan.updateMany({
        where: {
          userId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: body.isActive !== false
      },
      include: {
        meals: true
      }
    });

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    );
  }
}
