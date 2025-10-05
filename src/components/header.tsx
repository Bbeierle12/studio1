'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CookingPot,
  Home,
  PlusCircle,
  LogOut,
  LogIn,
  Library,
  ShoppingCart,
  Sun,
  Moon,
  Scale,
  Bookmark,
  Shield,
  Settings,
  CalendarDays,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { signOut, useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingList } from './shopping-list';
import { useTheme } from 'next-themes';
import { useUnit } from '@/context/unit-context';
import VoiceAssistant from './voice-assistant';

function getInitials(name?: string | null) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return name[0];
}

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const { unit, toggleUnit } = useUnit();
  
  // Weather state for voice assistant
  const [weather, setWeather] = useState<{
    temperature: number;
    condition: string;
    humidity?: number;
  } | null>(null);

  // Fetch weather when user logs in
  useEffect(() => {
    if (user) {
      // Mock weather data - can be replaced with real API
      const mockWeather = {
        temperature: 72,
        condition: 'Sunny',
        humidity: 45,
      };
      setWeather(mockWeather);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
  };

  // Check if user is admin
  const isAdmin = user?.role && ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(user.role);

  // All navigation links - only show when user is authenticated
  const navLinks = user ? [
    { href: '/', label: 'Home', icon: Home },
    { href: '/recipes', label: 'Browse', icon: CookingPot },
    { href: '/meal-plan', label: 'Meal Plan', icon: CalendarDays },
    { href: '/collections', label: 'Collections', icon: Library },
    { href: '/saved', label: 'Saved', icon: Bookmark },
    {
      href: '/recipes/new',
      label: 'Add Recipe',
      icon: PlusCircle,
      className: 'hidden sm:flex',
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      className: 'hidden sm:flex',
    },
    ...(isAdmin ? [{
      href: '/admin',
      label: 'Admin',
      icon: Shield,
      className: 'text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300',
    }] : []),
  ] : [];

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-16 items-center'>
        <Link href='/' className='mr-6 flex items-center space-x-2'>
          <CookingPot className='h-6 w-6' />
          <span className='font-bold sm:inline-block font-headline'>
            Our Family Table
          </span>
        </Link>
        <nav className='flex flex-1 items-center space-x-4 text-sm font-medium'>
          {navLinks.map(
            ({ href, label, icon: Icon, className: linkClassName }) => {
              const isActive =
                href === '/' ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 transition-colors hover:text-foreground/80',
                    isActive ? 'text-foreground' : 'text-foreground/60',
                    linkClassName
                  )}
                >
                  <Icon className='h-4 w-4' />
                  <span className='hidden sm:inline-block'>{label}</span>
                </Link>
              );
            }
          )}
        </nav>
        <div className='flex items-center justify-end gap-2'>
          {user && (
            <Button asChild variant='outline' size='sm' className='sm:hidden'>
              <Link href='/recipes/new'>
                <PlusCircle className='h-4 w-4' />
                <span className='sr-only'>Add Recipe</span>
              </Link>
            </Button>
          )}
          <ShoppingList />
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleUnit}
            aria-label={`Switch to ${unit === 'metric' ? 'imperial' : 'metric'} units`}
          >
            <Scale className='h-[1.2rem] w-[1.2rem]' />
            <span className='sr-only'>Toggle Units</span>
          </Button>
          <Button variant='ghost' size='icon' onClick={toggleTheme}>
            <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
            <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
            <span className='sr-only'>Toggle theme</span>
          </Button>
          {loading ? (
            <div className='h-8 w-20 animate-pulse rounded-md bg-muted' />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-8 w-8 rounded-full'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage
                      src={user.avatarUrl ?? undefined}
                      alt={user.name ?? 'User'}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56' align='end' forceMount>
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none'>
                      {user.name}
                    </p>
                    <p className='text-xs leading-none text-muted-foreground'>
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant='secondary' size='sm'>
              <Link href='/login'>
                <LogIn className='mr-2 h-4 w-4' />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {/* Voice Assistant - Only visible when logged in */}
      {user && <VoiceAssistant weather={weather} />}
    </header>
  );
}
