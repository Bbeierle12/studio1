import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';
import { arrayToCSV, generateCSVFilename, formatDateForCSV } from '@/lib/csv-utils';

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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const entityType = searchParams.get('entityType');

    // Build filters
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    // Fetch audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to prevent memory issues
    });

    // Format data for CSV
    const csvData = auditLogs.map((log) => ({
      ID: log.id,
      Date: formatDateForCSV(log.createdAt),
      Action: log.action,
      'User Name': log.user.name || 'N/A',
      'User Email': log.user.email,
      'User Role': log.user.role,
      'Entity Type': log.entityType || 'N/A',
      'Entity ID': log.entityId || 'N/A',
      'IP Address': log.ipAddress || 'N/A',
      Changes: log.changes || '',
      'User Agent': log.userAgent || 'N/A',
    }));

    // Generate CSV
    const csv = arrayToCSV(csvData);
    const filename = generateCSVFilename('audit_logs');

    // Create audit log for export action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT',
        entityType: 'audit_logs',
        entityId: 'export',
        changes: JSON.stringify({
          filters: {
            startDate,
            endDate,
            action,
            userId,
            entityType,
          },
          recordCount: auditLogs.length,
        }),
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
