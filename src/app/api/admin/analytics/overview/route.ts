import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'VIEW_ANALYTICS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get comprehensive stats
    const [
      totalUsers,
      totalRecipes,
      totalMealPlans,
      activeUsers7Days,
      activeUsers30Days,
      newUsers7Days,
      newUsers30Days,
      newRecipes7Days,
      newRecipes30Days,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count(),
      prisma.mealPlan.count(),
      prisma.user.count({
        where: { lastLogin: { gte: last7Days } },
      }),
      prisma.user.count({
        where: { lastLogin: { gte: last30Days } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: last30Days } },
      }),
      prisma.recipe.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.recipe.count({
        where: { createdAt: { gte: last30Days } },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    // Get user growth data for the last 30 days
    const userGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      userGrowth.push({
        date: startOfDay.toISOString().split('T')[0],
        count,
      });
    }

    // Get recipe creation data for the last 30 days
    const recipeGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await prisma.recipe.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      recipeGrowth.push({
        date: startOfDay.toISOString().split('T')[0],
        count,
      });
    }

    // Get top recipe creators
    const topCreators = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            recipes: true,
          },
        },
      },
      orderBy: {
        recipes: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalRecipes,
        totalMealPlans,
        activeUsers7Days,
        activeUsers30Days,
        newUsers7Days,
        newUsers30Days,
        newRecipes7Days,
        newRecipes30Days,
      },
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count,
      })),
      userGrowth,
      recipeGrowth,
      topCreators: topCreators.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        recipeCount: user._count.recipes,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
