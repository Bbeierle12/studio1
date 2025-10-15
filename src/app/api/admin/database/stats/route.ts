import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins can view database statistics.' },
        { status: 403 }
      );
    }

    const startTime = Date.now();

    // Get table counts
    const [
      userCount,
      recipeCount,
      favoriteRecipeCount,
      mealPlanCount,
      plannedMealCount,
      shoppingListCount,
      auditLogCount,
      systemSettingCount,
      featureFlagCount,
      nutritionGoalCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count(),
      prisma.favoriteRecipe.count(),
      prisma.mealPlan.count(),
      prisma.plannedMeal.count(),
      prisma.shoppingList.count(),
      prisma.auditLog.count(),
      prisma.systemSetting.count(),
      prisma.featureFlag.count(),
      prisma.nutritionGoal.count(),
    ]);

    const responseTime = Date.now() - startTime;

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    let healthMessage = 'Database is operating normally';

    if (responseTime > 1000) {
      healthStatus = 'warning';
      healthMessage = 'Database response time is higher than expected';
    } else if (responseTime > 5000) {
      healthStatus = 'error';
      healthMessage = 'Database response time is critically slow';
    }

    const stats = {
      tables: [
        { name: 'User', count: userCount },
        { name: 'Recipe', count: recipeCount },
        { name: 'FavoriteRecipe', count: favoriteRecipeCount },
        { name: 'MealPlan', count: mealPlanCount },
        { name: 'PlannedMeal', count: plannedMealCount },
        { name: 'ShoppingList', count: shoppingListCount },
        { name: 'AuditLog', count: auditLogCount },
        { name: 'SystemSetting', count: systemSettingCount },
        { name: 'FeatureFlag', count: featureFlagCount },
        { name: 'NutritionGoal', count: nutritionGoalCount },
      ],
      health: {
        status: healthStatus,
        message: healthMessage,
        responseTime,
      },
      prismaVersion: require('../../../../package.json').dependencies['@prisma/client'] || 'Unknown',
      databaseUrl: process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Hidden',
      lastMigration: null, // Could be enhanced to read migration history
    };

    // Log the database stats access
    await createAuditLog({
      userId: session.user.id,
      action: 'VIEW',
      entityType: 'System',
      changes: {
        action: 'viewed_database_stats',
        responseTime,
      },
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching database statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
