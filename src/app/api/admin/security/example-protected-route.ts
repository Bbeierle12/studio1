/**
 * Example: Protected Admin Route with All Security Features
 * This demonstrates how to use the comprehensive admin security middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminSecurity, createSecurityErrorResponse } from '@/lib/admin-security';
import { prisma } from '@/lib/data';
import { createAuditLog } from '@/lib/audit-log';
import { getClientIP } from '@/lib/ip-allowlist';

/**
 * Example: DELETE a user (highly sensitive operation)
 * Requires: SUPER_ADMIN + 2FA + IP allowlist + CSRF + Rate limiting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Run comprehensive security checks
  const securityCheck = await checkAdminSecurity(request, {
    requireSuperAdmin: true,    // Only SUPER_ADMIN can delete users
    require2FA: true,            // Must have verified 2FA in last 5 minutes
    requireIPAllowlist: true,    // Must be from approved IP
    requireCSRF: true,           // Must have valid CSRF token
    rateLimit: 'sensitive'       // Strict rate limiting (5 req/min)
  });

  if (!securityCheck.allowed) {
    return createSecurityErrorResponse(securityCheck);
  }

  const user = securityCheck.user!;

  try {
    // Perform the sensitive operation
    await prisma.user.delete({
      where: { id: params.id }
    });

    // Log the action
    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'User',
      entityId: params.id,
      ipAddress: getClientIP(request)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

/**
 * Example: UPDATE user (moderate sensitivity)
 * Requires: CONTENT_ADMIN or higher + CSRF + Rate limiting
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Less strict security for updates
  const securityCheck = await checkAdminSecurity(request, {
    requireSuperAdmin: false,    // CONTENT_ADMIN can update
    require2FA: false,           // 2FA not required for updates
    requireIPAllowlist: false,   // IP allowlist not required
    requireCSRF: true,           // CSRF still required
    rateLimit: 'mutations'       // Standard mutation rate limit (10 req/min)
  });

  if (!securityCheck.allowed) {
    return createSecurityErrorResponse(securityCheck);
  }

  const user = securityCheck.user!;

  try {
    const body = await request.json();

    await prisma.user.update({
      where: { id: params.id },
      data: body
    });

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: params.id,
      changes: body,
      ipAddress: getClientIP(request)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * Example: GET user (read-only)
 * Requires: Basic admin auth only + general rate limiting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Minimal security for read operations
  const securityCheck = await checkAdminSecurity(request, {
    requireSuperAdmin: false,
    require2FA: false,
    requireIPAllowlist: false,
    requireCSRF: false,          // No CSRF for GET requests
    rateLimit: 'general'         // Generous rate limit (100 req/min)
  });

  if (!securityCheck.allowed) {
    return createSecurityErrorResponse(securityCheck);
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
