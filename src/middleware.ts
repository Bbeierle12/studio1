import { withAuth } from 'next-auth/middleware';
import { type NextRequest, NextResponse } from 'next/server';

// Only these routes are public (accessible without login)
const PUBLIC_ROUTES = ['/login', '/register', '/maintenance'];

// Routes that should be accessible even during maintenance
const MAINTENANCE_EXEMPT_ROUTES = [
  '/login',
  '/register',
  '/maintenance',
  '/api/maintenance',
  '/api/auth',
  '/_next',
  '/favicon.ico',
];

export default withAuth(
  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip maintenance check for exempt routes
    const isExempt = MAINTENANCE_EXEMPT_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    if (isExempt) {
      return NextResponse.next();
    }

    // Check if user is admin
    const token = request.nextUrl.searchParams.get('token');
    const isAdmin = ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(
      (request as any).nextauth?.token?.role || ''
    );

    // Check maintenance mode from cookie (set by API)
    const maintenanceMode = request.cookies.get('maintenance_mode')?.value === 'true';

    // If maintenance mode is on and user is not admin, redirect to maintenance page
    if (maintenanceMode && !isAdmin && pathname !== '/maintenance') {
      const maintenanceUrl = new URL('/maintenance', request.url);
      return NextResponse.redirect(maintenanceUrl);
    }

    // If maintenance mode is off and user is on maintenance page, redirect to home
    if (!maintenanceMode && pathname === '/maintenance') {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes (login, register, and maintenance pages)
        if (PUBLIC_ROUTES.includes(pathname)) {
          return true;
        }
        
        // Check if route is admin
        if (pathname.startsWith('/admin')) {
          const role = token?.role as string;
          return ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(role || '');
        }
        
        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
