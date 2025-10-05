import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
