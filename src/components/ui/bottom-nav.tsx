'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, BookOpen, ShoppingBag, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Recipes',
      href: '/recipes',
      icon: BookOpen,
    },
    {
      name: 'Calendar',
      href: '/meal-plan',
      icon: Calendar,
    },
    {
      name: 'Shopping',
      href: '/meal-plan?view=shopping',
      icon: ShoppingBag,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
  ];

  // Do not show bottom nav on auth or admin pages
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-20 w-full items-center justify-around bg-background/90 px-2 pb-safe pt-2 backdrop-blur-md border-t md:hidden shadow-md3-2">
      {navItems.map((item) => {
        // Active state checking handles query params specifically for shopping
        const isActive =
          item.href.includes('?view=shopping')
            ? pathname === '/meal-plan' && typeof window !== 'undefined' && window.location.search.includes('view=shopping')
            : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !item.href.includes('?'));

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-md3-lg transition-colors duration-200 tap-highlight-transparent',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {/* Active Indicator Pill (MD3 standard) */}
            <div
              className={cn(
                'absolute top-0 flex h-8 w-16 items-center justify-center rounded-full transition-opacity duration-200',
                isActive ? 'bg-primary/20 opacity-100' : 'opacity-0 group-hover:bg-accent group-hover:opacity-50'
              )}
            />
            
            <item.icon
              className={cn(
                'relative z-10 h-6 w-6 transition-transform duration-200',
                isActive ? 'scale-110' : 'scale-100'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium leading-none tracking-tight transition-all duration-200 mt-1',
                isActive ? 'font-bold text-primary' : 'font-normal'
              )}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
