'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CookingPot,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Scale,
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
import AIChatAssistant from './ai-chat-assistant';
import { useToast } from '@/hooks/use-toast';

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
  
  const [weather, setWeather] = useState<{
    temperature: number;
    condition: string;
    humidity?: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
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

  const handleUnitToggle = () => {
    toggleUnit();
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    toast({
    title: 'Units Changed',
    description: `Switched to ${newUnit === 'metric' ? 'Metric (kg, g, °C)' : 'Imperial (lb, oz, °F)'}`,
      duration: 2000,
    });
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
        'sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border',
        user && 'md:pl-0' // Sidebar handles the offset
      )}>
    {/* Decorative Top Strip */}
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

        <div className='container flex h-14 items-center'>
          {/* Mobile Logo (shown when sidebar hidden) */}
       <Link 
    href='/' 
      className='flex items-center gap-2 px-2 py-1 rounded-lg transition-all md:hidden'
      >
    <CookingPot className='h-5 w-5 text-primary' />
     <span className='font-bold text-sm'>Our Family Table</span>
          </Link>

        {/* Spacer for desktop */
<div className="flex-1 hidden md:block" />}

          {/* Right side utilities */}
          <div className='flex items-center justify-end gap-2 ml-auto'>
       <ShoppingList />
            
  <Button
    variant='ghost'
  size='icon'
        onClick={handleUnitToggle}
       aria-label={`Switch to ${unit === 'metric' ? 'imperial' : 'metric'} units`}
   title={`Current: ${unit === 'metric' ? 'Metric (kg, °C)' : 'Imperial (lb, °F)'}`}
   >
        <Scale className='h-[1.1rem] w-[1.1rem]' />
       <span className='absolute -bottom-0.5 right-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center'>
      {unit === 'metric' ? 'M' : 'I'}
 </span>
  </Button>

    <Button variant='ghost' size='icon' onClick={toggleTheme}>
      <Sun className='h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
              <Moon className='absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
            </Button>

   {loading ? (
  <div className='h-8 w-8 animate-pulse rounded-full bg-muted' />
            ) : user ? (
   <DropdownMenu>
   <DropdownMenuTrigger asChild>
       <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
             <Avatar className='h-8 w-8'>
             <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? 'User'} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
  </Avatar>
     </Button>
           </DropdownMenuTrigger>
   <DropdownMenuContent className='w-56' align='end' forceMount>
             <DropdownMenuLabel className='font-normal'>
                 <div className='flex flex-col space-y-1'>
        <p className='text-sm font-medium leading-none'>{user.name}</p>
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
      </header>
      
      {user && <AIChatAssistant weather={weather} />}
    </>
  );
}
