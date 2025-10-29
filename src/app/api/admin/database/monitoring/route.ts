import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbMonitor } from '@/lib/database-monitoring';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'slow-queries': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const queries = await dbMonitor.getTopSlowQueries(limit);
        return NextResponse.json({ queries });
      }

      case 'migration-status': {
        const status = await dbMonitor.checkMigrationStatus();
        return NextResponse.json(status);
      }

      case 'storage-metrics': {
        const metrics = await dbMonitor.getStorageMetrics();
        const growthData = dbMonitor.getStorageGrowthData();
        return NextResponse.json({
          current: metrics,
          history: growthData
        });
      }

      case 'performance': {
        const metrics = await dbMonitor.getPerformanceMetrics();
        return NextResponse.json(metrics);
      }

      case 'patterns': {
        const patterns = dbMonitor.analyzeQueryPatterns();
        return NextResponse.json(patterns);
      }

      case 'overview':
      default: {
        const [migration, storage, performance, patterns] = await Promise.all([
          dbMonitor.checkMigrationStatus(),
          dbMonitor.getStorageMetrics(),
          dbMonitor.getPerformanceMetrics(),
          dbMonitor.analyzeQueryPatterns(),
        ]);

        return NextResponse.json({
          migration,
          storage,
          performance,
          patterns,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Database monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual query recording (for testing)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, duration, table, operation } = body;

    dbMonitor.recordQuery(
      query,
      duration,
      table,
      operation,
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Query recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record query' },
      { status: 500 }
    );
  }
}