'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CookingPot, Home, PlusCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/recipes', label: 'Browse', icon: CookingPot },
    { href: '/recipes/new', label: 'Add Recipe', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CookingPot className="h-6 w-6" />
          <span className="font-bold sm:inline-block font-headline">
            Our Family Table
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 transition-colors hover:text-foreground/80',
                  isActive ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline-block">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-end">
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
