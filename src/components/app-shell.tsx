'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { DynamicBreadcrumbs } from '@/components/dynamic-breadcrumbs';
import { Sidebar } from '@/components/sidebar';
import { BottomNav } from '@/components/ui/bottom-nav';

// Routes that render standalone — no sidebar/header/breadcrumbs/bottom-nav.
// Auth screens are full-bleed by design (see design-handoff login/register).
const STANDALONE_ROUTES = ['/login', '/register'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const standalone = STANDALONE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen w-full">
      {/* Sidebar - fixed position, handled internally */}
      <Sidebar />

      {/* Main content area with sidebar offset */}
      <div className="flex flex-1 flex-col pb-20 transition-all duration-300 md:pl-64 md:pb-0">
        <Header />
        <DynamicBreadcrumbs />
        <main className="flex-1">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
