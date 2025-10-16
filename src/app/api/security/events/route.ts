/**
 * Security Events API
 * View security events and audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getUserSecurityEvents,
  getRecentSecurityEvents,
} from '@/lib/security-webhooks';

// GET - Get security events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userRole = (session.user as any).role;

    // Admins can view all events or specific user events
    if (['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      if (userId) {
        const events = await getUserSecurityEvents(userId, limit);
        return NextResponse.json({ events });
      } else {
        const events = await getRecentSecurityEvents(limit);
        return NextResponse.json({ events });
      }
    }

    // Regular users can only view their own events
    const events = await getUserSecurityEvents((session.user as any).id, limit);
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}
