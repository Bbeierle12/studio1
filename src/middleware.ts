import { withAuth } from 'next-auth/middleware';
import { type NextRequest, NextResponse } from 'next/server';

// Only these routes are public (accessible without login)
const PUBLIC_ROUTES = ['/login', '/register'];

export default withAuth(
  function middleware(request: NextRequest) {
    // This function runs after authentication check
    // You can add additional logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes (login and register pages)
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
