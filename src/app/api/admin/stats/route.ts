import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { isAdmin } from '@/lib/admin-permissions';
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(isAdmin);
    if (!auth.authorized) return auth.response;

    // Get statistics
    const [totalUsers, totalRecipes, activeUsersCount] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count(),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    // For now, collections is 0 - add when collections feature is implemented
    const totalCollections = 0;

    return NextResponse.json({
      totalUsers,
      totalRecipes,
      totalCollections,
      activeUsers: activeUsersCount,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
