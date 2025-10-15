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

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured');
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 500 }
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
      prismaVersion: '^6.16.2', // Hardcoded version - update when upgrading Prisma
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
  } catch (error: any) {
    console.error('Error fetching database statistics:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch database statistics';
    
    if (error.code === 'P1001') {
      errorMessage = 'Cannot connect to database. Please check DATABASE_URL.';
    } else if (error.code === 'P2021') {
      errorMessage = 'Database table does not exist. Please run migrations.';
    } else if (error.message?.includes('connect')) {
      errorMessage = 'Database connection failed. Please check your database is running.';
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
