import { withAuth } from 'next-auth/middleware';
import { type NextRequest, NextResponse } from 'next/server';

// Only these routes are public (accessible without login)
const PUBLIC_ROUTES = ['/login', '/register', '/maintenance'];

// API routes that must stay reachable even for a suspended user (auth flows,
// account creation, maintenance status). Everything else under /api enforces
// the isActive lockout below. `/api/auth` covers all NextAuth handlers
// (session, signout, csrf, callbacks, webauthn/authenticate).
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/register',
  '/api/maintenance/status',
];

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

    // API routes keep their own per-route auth and are intentionally exempt
    // from the page maintenance redirect below. Enforce the suspension lockout
    // here with a JSON 403 so a suspended user's still-valid JWT cannot hit
    // protected API endpoints; then pass through to the route handler.
    if (pathname.startsWith('/api')) {
      const isPublicApi = PUBLIC_API_ROUTES.some((route) =>
        pathname.startsWith(route)
      );
      if (!isPublicApi) {
        const apiToken = (request as any).nextauth?.token;
        if (apiToken && apiToken.isActive === false) {
          return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
        }
      }
      return NextResponse.next();
    }

    // Redirect /collections to the new nested location
    if (pathname === '/collections') {
      const url = new URL('/recipes?tab=browse&subTab=collections', request.url);
      return NextResponse.redirect(url);
    }

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

        // API routes are handled inside the middleware function above (JSON 403
        // for suspended users) and by each route's own auth check. Let withAuth
        // pass them through here so it never HTML-redirects an API request.
        if (pathname.startsWith('/api')) {
          return true;
        }

        // Allow access to public routes (login, register, and maintenance pages)
        if (PUBLIC_ROUTES.includes(pathname)) {
          return true;
        }

        // Deny suspended accounts everywhere else. The jwt callback refreshes
        // `isActive` from the database, so a just-suspended user is locked out
        // on their next request rather than after their 30-day token expires.
        if (token && (token as any).isActive === false) {
          return false;
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - PWA surface: manifest.json, sw.js, icons/, screenshots/. These must be
     *   publicly fetchable — Android reads share_target out of the manifest to
     *   register the app in the system share sheet, and a gated manifest/sw
     *   also blocks install entirely.
     * NOTE: /api IS matched (so the suspension lockout runs on API routes); the
     * middleware short-circuits API requests to a JSON 403 or pass-through.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|screenshots/).*)',
  ],
};
