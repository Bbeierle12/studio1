'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbSegment {
  label: string;
  href: string;
}

const routeLabels: Record<string, string> = {
  recipes: 'Recipe Hub',
  'meal-plan': 'Meal Plan',
  household: 'Family',
  saved: 'Saved',
  settings: 'Settings',
  admin: 'Admin',
  new: 'New Recipe',
  edit: 'Edit',
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page
  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbSegment[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, href };
  });

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span className="sr-only md:not-sr-only">Foyer</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              return (
                <span key={crumb.href} className="flex items-center gap-2">
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
