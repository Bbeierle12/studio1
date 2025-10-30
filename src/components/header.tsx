'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  CookingPot,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Ruler,
  Search,
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function getInitials(name?: string | null) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return name[0];
}

export function Header() {
  const { user, loading } = useAuth();
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const { unit, toggleUnit } = useUnit();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await signOut();
  };

  const handleUnitToggle = () => {
    toggleUnit();
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    toast({
      title: 'Units Changed',
      description: `Switched to ${newUnit === 'metric' ? 'Metric (kg, g, °C)' : 'Imperial (lb, oz, °F)'}`,
      duration: 2000,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recipes?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <>
      {/* Slim Top Header */}
      <header className={cn(
        'sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative',
        user && 'md:pl-0' // Sidebar handles the offset
      )}>
        {/* Decorative Top Strip with smooth gradient */}
        <div 
          className='h-1 w-full relative'
          style={{
  background: 'linear-gradient(180deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.08) 50%, hsl(var(--primary) / 0.15) 100%)',
        boxShadow: `
              inset 0 1px 0 hsl(var(--primary) / 0.2),
   inset 0 -1px 0 hsl(var(--primary) / 0.1)
    `,
 }}
        >
          <div 
    className='absolute inset-0 opacity-40'
  style={{
   background: 'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)',
            }}
  />
        </div>

        {/* Smooth gradient border bottom */}
        <div 
     className='absolute bottom-0 left-0 right-0 h-px'
    style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(var(--border) / 0.5) 10%, hsl(var(--border) / 0.8) 50%, hsl(var(--border) / 0.5) 90%, transparent 100%)',
          }}
        />

        <div className='container flex h-16 items-center px-4'>
          {/* Mobile Logo (shown when sidebar hidden) */}
  <Link 
      href='/' 
            className='flex items-center gap-2 px-2 py-1 rounded-lg transition-all md:hidden hover:bg-primary/10'
          >
            <CookingPot className='h-6 w-6 text-primary' />
            <span className='font-bold text-base'>Our Family Table</span>
      </Link>

          {/* Spacer for desktop */}
          <div className="flex-1 hidden md:block" />

          {/* Global Search Bar - Center Position */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              />
            </form>
          </div>

{/* Right side utilities */}
          <TooltipProvider delayDuration={300}>
            <div className='flex items-center justify-end gap-3 ml-auto'>
  {/* Shopping List */}
       <ShoppingList />
          
          {/* Unit Toggle */}
          <Tooltip>
       <TooltipTrigger asChild>
  <Button
     variant='ghost'
           size='icon'
    className='h-10 w-10 relative hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary'
    onClick={handleUnitToggle}
        aria-label={`Switch to ${unit === 'metric' ? 'imperial' : 'metric'} units`}
       >
     <Ruler className='h-5 w-5' />
  <span className='absolute bottom-1 right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center shadow-sm'>
               {unit === 'metric' ? 'M' : 'I'}
     </span>
       </Button>
    </TooltipTrigger>
          <TooltipContent side='bottom'>
                  <p className='text-sm'>
          {unit === 'metric' ? 'Metric (kg, g, °C)' : 'Imperial (lb, oz, °F)'}
     </p>
       <p className='text-xs text-muted-foreground'>Click to switch</p>
       </TooltipContent>
          </Tooltip>   {/* Theme Toggle */}
     <Tooltip>
      <TooltipTrigger asChild>
            <Button 
    variant='ghost' 
     size='icon' 
          className='h-10 w-10 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary'
  onClick={toggleTheme}
        aria-label='Toggle theme'
  >
                    <Sun className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
        <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
  </Button>
        </TooltipTrigger>
              <TooltipContent side='bottom'>
    <p className='text-sm'>
       {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </p>
         </TooltipContent>
  </Tooltip>

       {/* User Menu / Login */}
  {loading ? (
             <div className='h-10 w-10 animate-pulse rounded-full bg-muted' />
      ) : user ? (
              <DropdownMenu>
          <Tooltip>
     <TooltipTrigger asChild>
      <DropdownMenuTrigger asChild>
         <Button 
   variant='ghost' 
      className='relative h-10 w-10 rounded-full hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary ring-offset-2'
          >
     <Avatar className='h-9 w-9'>
<AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? 'User'} />
 <AvatarFallback className='text-sm font-semibold bg-primary/20 text-primary'>
                   {getInitials(user.name)}
         </AvatarFallback>
     </Avatar>
    </Button>
          </DropdownMenuTrigger>
          </TooltipTrigger>
                 <TooltipContent side='bottom'>
          <p className='text-sm'>{user.name}</p>
             <p className='text-xs text-muted-foreground'>Account settings</p>
          </TooltipContent>
      </Tooltip>
       <DropdownMenuContent className='w-64' align='end' forceMount>
               <DropdownMenuLabel className='font-normal'>
<div className='flex flex-col space-y-1'>
         <p className='text-sm font-medium leading-none'>{user.name}</p>
 <p className='text-xs leading-none text-muted-foreground'>
   {session?.user?.email}
      </p>
       </div>
         </DropdownMenuLabel>
        <DropdownMenuSeparator />
     <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
        <LogOut className='mr-2 h-4 w-4' />
                <span>Log out</span>
       </DropdownMenuItem>
    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
              <Button asChild variant='secondary' size='default' className='h-10'>
             <Link href='/login'>
        <LogIn className='mr-2 h-4 w-4' />
             Sign in
           </Link>
     </Button>
   )}
    </div>
          </TooltipProvider>
        </div>
      </header>
    </>
  );
}
