/**
 * API Route: CSRF Token Generation
 * GET /api/admin/security/csrf - Generate new CSRF token
 */

import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';
import { isAdmin } from '@/lib/admin-permissions';
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET() {
  try {
    // CSRF tokens here protect admin forms — restrict issuance to admins so a
    // regular USER session cannot mint tokens for admin endpoints.
    const auth = await requireAdmin(isAdmin);
    if (!auth.authorized) return auth.response;

    const token = await generateCSRFToken(auth.user.id);

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
