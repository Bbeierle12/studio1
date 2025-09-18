import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/recipes/new', '/recipes/generate', '/recipes/.*/edit'];
const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(path => new RegExp(`^${path}$`).test(pathname));
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isProtectedRoute && !sessionCookie) {
    // Redirect to login if trying to access a protected route without a session
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute && sessionCookie) {
    // Redirect to home if trying to access a public route (like login) with a session
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
