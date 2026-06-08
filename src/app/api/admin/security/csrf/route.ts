/**
 * API Route: CSRF Token Generation
 * GET /api/admin/security/csrf - Generate new CSRF token
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCSRFToken } from '@/lib/csrf';
import { prisma } from '@/lib/data';
import { isAdmin } from '@/lib/admin-permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CSRF tokens here protect admin forms — restrict issuance to admins so a
    // regular USER session cannot mint tokens for admin endpoints.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = await generateCSRFToken(session.user.id);

    return NextResponse.json({
      token,
      expiresIn: '1 hour'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
