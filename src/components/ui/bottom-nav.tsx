'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  CalendarDays,
  Bookmark,
  Menu,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const PRIMARY = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Recipes', href: '/recipes', icon: BookOpen },
  { name: 'Plan', href: '/meal-plan', icon: CalendarDays },
  { name: 'Saved', href: '/saved', icon: Bookmark },
];

const MORE = [
  { name: 'Family', href: '/household', icon: Users },
  { name: 'AI Chat', href: '/recipe-chat', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  // Do not show bottom nav on auth or admin pages
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/admin')
  ) {
    return null;
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);
  const moreActive = MORE.some((item) => isActive(item.href));

  const itemClasses = (active: boolean) =>
    cn(
      'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-md3-lg transition-colors duration-200',
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    );

  const pillClasses = (active: boolean) =>
    cn(
      'absolute top-0 flex h-8 w-16 items-center justify-center rounded-full transition-opacity duration-200',
      active
        ? 'bg-primary/20 opacity-100'
        : 'opacity-0 group-hover:bg-accent group-hover:opacity-50'
    );

  const labelClasses = (active: boolean) =>
    cn(
      'text-[10px] font-medium leading-none tracking-tight transition-all duration-200 mt-1',
      active ? 'font-bold text-primary' : 'font-normal'
    );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-20 w-full items-center justify-around bg-background/90 px-2 pb-safe pt-2 backdrop-blur-md border-t md:hidden shadow-md3-2">
      {PRIMARY.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.name} href={item.href} className={itemClasses(active)}>
            <div className={pillClasses(active)} />
            <Icon
              className={cn(
                'relative z-10 h-6 w-6 transition-transform duration-200',
                active ? 'scale-110' : 'scale-100'
              )}
            />
            <span className={labelClasses(active)}>{item.name}</span>
          </Link>
        );
      })}

      {/* More menu — surfaces the secondary destinations that don't fit the bar */}
      <Sheet>
        <SheetTrigger asChild>
          <button className={itemClasses(moreActive)} aria-label="More">
            <div className={pillClasses(moreActive)} />
            <Menu
              className={cn(
                'relative z-10 h-6 w-6 transition-transform duration-200',
                moreActive ? 'scale-110' : 'scale-100'
              )}
            />
            <span className={labelClasses(moreActive)}>More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="md:hidden">
          <SheetHeader>
            <SheetTitle className="text-left font-headline">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {MORE.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <SheetClose asChild key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border border-border p-4 transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'bg-card text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
