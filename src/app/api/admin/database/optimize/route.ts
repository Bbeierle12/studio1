import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins can optimize database.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { operation } = body;

    if (!operation || !['analyze', 'reindex'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be: analyze or reindex' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let result: any = {};

    try {
      if (operation === 'analyze') {
        // PostgreSQL: ANALYZE updates table statistics
        // This helps the query planner make better decisions
        await prisma.$executeRawUnsafe('ANALYZE');
        result = {
          operation: 'analyze',
          message: 'Table statistics updated successfully',
        };
      } else if (operation === 'reindex') {
        // PostgreSQL: REINDEX rebuilds indexes
        // Get all table names to reindex
        const tables = [
          'User',
          'Recipe',
          'FavoriteRecipe',
          'MealPlan',
          'PlannedMeal',
          'ShoppingList',
          'AuditLog',
          'SystemSetting',
          'FeatureFlag',
          'NutritionGoal',
        ];

        // Reindex each table
        for (const table of tables) {
          try {
            await prisma.$executeRawUnsafe(`REINDEX TABLE "${table}"`);
          } catch (error) {
            console.error(`Failed to reindex table ${table}:`, error);
            // Continue with other tables even if one fails
          }
        }

        result = {
          operation: 'reindex',
          message: 'Database indexes rebuilt successfully',
          tablesReindexed: tables.length,
        };
      }

      const duration = Date.now() - startTime;
      result.duration = `${duration}ms`;

      // Log the optimization action
      await createAuditLog({
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'System',
        entityId: 'database-optimization',
        changes: {
          operation,
          duration,
          result,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (dbError: any) {
      // Handle database-specific errors gracefully
      console.error('Database optimization error:', dbError);

      // If it's a PostgreSQL-specific command that failed, provide helpful message
      if (dbError.message?.includes('syntax error') || dbError.message?.includes('ANALYZE')) {
        return NextResponse.json({
          success: false,
          message: 'This operation is PostgreSQL-specific. Your database may not support it.',
          error: 'Database optimization not supported',
        }, { status: 400 });
      }

      throw dbError;
    }
  } catch (error) {
    console.error('Error optimizing database:', error);
    return NextResponse.json(
      { error: 'Failed to optimize database' },
      { status: 500 }
    );
  }
}
