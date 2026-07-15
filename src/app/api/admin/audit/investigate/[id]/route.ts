/**
 * Audit Investigation API
 * GET /api/admin/audit/investigate/[id] - Get investigation context for a log
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { getInvestigationContext } from '@/lib/audit-enhanced';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin('VIEW_AUDIT_LOGS');
    if (!auth.authorized) return auth.response;

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
