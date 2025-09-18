import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

const PROTECTED_ROUTES = ['/recipes/new', '/recipes/generate'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get('session')?.value;

  if (PROTECTED_ROUTES.some(path => pathname.startsWith(path))) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await auth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
      console.log('Session cookie verification failed, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
