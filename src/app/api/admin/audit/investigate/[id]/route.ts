/**
 * Audit Investigation API
 * GET /api/admin/audit/investigate/[id] - Get investigation context for a log
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';
import { getInvestigationContext } from '@/lib/audit-enhanced';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const context = await getInvestigationContext(id);

    if (!context) {
      return NextResponse.json(
        { error: 'Audit log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(context);
  } catch (error) {
    console.error('Error in investigation API:', error);
    return NextResponse.json(
      { error: 'Failed to get investigation context' },
      { status: 500 }
    );
  }
}
