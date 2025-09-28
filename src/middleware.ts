import { withAuth } from 'next-auth/middleware';
import { type NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/recipes/new',
  '/recipes/generate',
  '/recipes/[^/]+/edit',
  '/saved',
  '/collections',
];

const PUBLIC_ROUTES = ['/login', '/'];

export default withAuth(
  function middleware(request: NextRequest) {
    // This function runs after authentication check
    // You can add additional logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (PUBLIC_ROUTES.includes(pathname) || pathname === '/') {
          return true;
        }
        
        // Check if route is protected
        const isProtectedRoute = PROTECTED_ROUTES.some(route => {
          const regex = new RegExp(`^${route.replace('[^/]+', '[^/]+')}$`);
          return regex.test(pathname);
        });
        
        if (isProtectedRoute) {
          // Require authentication for protected routes
          return !!token;
        }
        
        // Allow access to other routes
        return true;
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
