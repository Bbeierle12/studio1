'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export function MaintenanceModeChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    // Skip check for maintenance page and auth pages
    const exemptRoutes = ['/maintenance', '/login', '/register'];
    if (exemptRoutes.includes(pathname)) {
      return;
    }

    // Check if user is admin
    const isAdmin = user && ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(user.role || '');

    // If user is admin, skip maintenance check
    if (isAdmin) {
      return;
    }

    // Check maintenance mode
    const checkMaintenance = async () => {
      try {
        const response = await fetch('/api/maintenance/status');
        const data = await response.json();

        if (data.maintenanceMode && pathname !== '/maintenance') {
          router.push('/maintenance');
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    };

    checkMaintenance();

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkMaintenance, 30000);

    return () => clearInterval(interval);
  }, [pathname, user, router]);

  return <>{children}</>;
}
