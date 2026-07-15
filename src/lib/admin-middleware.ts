import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import type { UserRole } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission, ADMIN_PERMISSIONS } from '@/lib/admin-permissions';

export type AdminAuthUser = { id: string; role: UserRole; email: string | null };

export type RequireAdminResult =
  | { authorized: true; user: AdminAuthUser }
  | { authorized: false; response: NextResponse };

type AdminRequirement =
  | keyof typeof ADMIN_PERMISSIONS
  | ((role: UserRole) => boolean);

/**
 * Route-handler authorization guard for `/api/admin/**` endpoints.
 *
 * Standardized responses:
 *   - unauthenticated            -> 401 { error: 'Unauthorized' }
 *   - authenticated, not allowed -> 403 { error: forbiddenMessage }
 *
 * `requirement` is either a permission key (checked via `hasPermission`) or a
 * predicate over the user's role (e.g. `isSuperAdmin`, `isAdmin`). On success
 * the resolved admin user is returned so callers can run additional per-action
 * permission checks (e.g. escalating from EDIT_USERS to DELETE_USERS).
 */
export async function requireAdmin(
  requirement: AdminRequirement,
  forbiddenMessage = 'Forbidden'
): Promise<RequireAdminResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true },
  });

  const permitted =
    !!user &&
    (typeof requirement === 'function'
      ? requirement(user.role)
      : hasPermission(user.role, requirement));

  if (!permitted) {
    return {
      authorized: false,
      response: NextResponse.json({ error: forbiddenMessage }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}

export async function adminMiddleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if user has admin role
  const userRole = token.role as string;
  const isAdmin = ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(userRole);

  if (!isAdmin) {
    // Redirect non-admin users to home with error message
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(url);
  }

  // Allow access for admins
  return NextResponse.next();
}

export function requireSuperAdmin(request: NextRequest, token: any) {
  return token.role === 'SUPER_ADMIN';
}

export function requireContentAdmin(request: NextRequest, token: any) {
  return ['CONTENT_ADMIN', 'SUPER_ADMIN'].includes(token.role);
}

export function requireAnyAdmin(request: NextRequest, token: any) {
  return ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(token.role);
}
