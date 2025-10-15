/**
 * Enhanced Audit API with full-text search, date filters, and export
 * GET /api/admin/audit/enhanced
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';
import { searchAuditLogs, exportToCSV, exportToJSON, getAuditStatistics, QuickRange } from '@/lib/audit-enhanced';

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

    if (!adminUser || !hasPermission(adminUser.role, 'VIEW_AUDIT_LOGS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const ipAddress = searchParams.get('ipAddress') || undefined;
    const search = searchParams.get('search') || undefined;
    const quickRange = (searchParams.get('quickRange') || undefined) as QuickRange | undefined;
    
    // Custom date range
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined;

    // Export format
    const exportFormat = searchParams.get('export');
    const includeStats = searchParams.get('stats') === 'true';

    const result = await searchAuditLogs({
      userId,
      action: action as any,
      entityType: entityType as any,
      ipAddress,
      search,
      quickRange,
      startDate,
      endDate,
      limit: exportFormat ? 10000 : limit, // Larger limit for exports
      offset: exportFormat ? 0 : offset,
    });

    // Handle exports
    if (exportFormat === 'csv') {
      const csv = exportToCSV(result.logs);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
        },
      });
    }

    if (exportFormat === 'json') {
      const json = exportToJSON(result.logs);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.json"`,
        },
      });
    }

    // Get statistics if requested
    let statistics = undefined;
    if (includeStats) {
      statistics = await getAuditStatistics({
        userId,
        action: action as any,
        entityType: entityType as any,
        quickRange,
        startDate,
        endDate,
      });
    }

    const totalPages = Math.ceil(result.total / limit);

    return NextResponse.json({
      logs: result.logs,
      pagination: {
        page,
        limit,
        totalCount: result.total,
        totalPages,
      },
      statistics,
    });
  } catch (error) {
    console.error('Error in enhanced audit API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
