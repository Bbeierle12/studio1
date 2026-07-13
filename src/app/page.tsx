'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FoyerWeekCalendar } from '@/components/foyer/foyer-week-calendar';
import { useWeather, getWeatherForDate } from '@/hooks/use-weather';
import {
  ChefHat,
  CalendarDays,
  Sparkles,
  CloudSun,
  BookOpen,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { title: 'Browse recipes', desc: 'Find your next meal', href: '/recipes', Icon: BookOpen, hue: 'chart-1' },
  { title: 'AI recipe chat', desc: 'Cook with what you have', href: '/recipe-chat', Icon: Sparkles, hue: 'chart-2' },
  { title: 'Plan meals', desc: 'Fill out your week', href: '/meal-plan', Icon: CalendarDays, hue: 'chart-3' },
  { title: 'Cook mode', desc: 'Hands-free, step by step', href: '/cook', Icon: ChefHat, hue: 'chart-4' },
] as const;

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Today's real forecast, at the user's actual coordinates. Null when we don't know —
  // the greeting simply omits the weather rather than asserting a number.
  const today = new Date();
  const { weatherForecast } = useWeather(user ? today : undefined, user ? today : undefined);
  const weather = getWeatherForDate(weatherForecast, today);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, forcing session refresh');
        setLoadingTimeout(true);
        router.refresh();
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading, router]);


  // Show loading state
  if (loading && !loadingTimeout) {
    return (
      <div className='flex min-h-[80vh] items-center justify-center'>
        <div className='animate-pulse text-lg text-muted-foreground'>
          Loading...
        </div>
      </div>
    );
  }

  // If loading timed out, show error state
  if (loadingTimeout) {
    return (
      <div className='flex min-h-[80vh] flex-col items-center justify-center gap-4'>
        <div className='text-lg text-muted-foreground'>
          Session loading timed out. Please try refreshing the page.
        </div>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  // If not authenticated, redirect is happening
  if (!user) {
    return null;
  }

  // Authenticated user - show family foyer
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className='flex-grow'>
      <main className='relative flex grow flex-col items-center p-4 md:p-8'>
        {/* Family Foyer - Simple Hub */}
        <div className='w-full max-w-6xl space-y-8'>
          {/* Welcome hero — tokened warm gradient; left-aligned with weather,
              greeting, and CTAs (white text sits on the brand gradient). */}
          <section className='relative overflow-hidden rounded-[20px] p-8 md:p-9 shadow-md3-2 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(24_46%_22%)_100%)]'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(110%_90%_at_85%_0%,hsl(var(--meal-breakfast)/0.28)_0%,transparent_55%)]' />
            <ChefHat
              className='pointer-events-none absolute -bottom-8 -right-4 h-40 w-40 text-white/10'
              strokeWidth={1}
              aria-hidden
            />
            <div className='relative max-w-2xl'>
              {weather && (
                <div className='mb-2 flex items-center gap-2 text-sm font-medium text-white/85'>
                  <CloudSun className='h-4 w-4' />
                  {weekday} · {Math.round(weather.temperature.current)}° {weather.condition}
                </div>
              )}
              <h1 className='font-headline text-3xl md:text-4xl font-bold text-white mb-2'>
                {greeting}, {user?.name || 'Friend'}.
              </h1>
              <p className='mb-5 max-w-xl text-base md:text-lg text-white/85'>
                Your family&apos;s table for the week — plan meals, cook together,
                and keep the recipes that matter.
              </p>
              <div className='flex flex-wrap gap-3'>
                <Button
                  asChild
                  className='bg-white text-primary hover:bg-white/90'
                >
                  <Link href='/meal-plan'>
                    <CalendarDays className='mr-2 h-4 w-4' />
                    Plan this week
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  className='border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white'
                >
                  <Link href='/recipe-chat'>
                    <Sparkles className='mr-2 h-4 w-4' />
                    Ask the AI chef
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Simple Hub - The Living Room */}
          <div className='space-y-6'>
            {/* Week Calendar View */}
            <FoyerWeekCalendar />

            {/* Quick Action Cards */}
            <div>
              <p className='mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Jump back in
              </p>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                {QUICK_ACTIONS.map(({ title, desc, href, Icon, hue }) => (
                  <Link
                    key={title}
                    href={href}
                    className='flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-md3-1 transition-all hover:border-primary/40 hover:shadow-md3-3'
                  >
                    <span
                      className='grid h-11 w-11 place-items-center rounded-xl'
                      style={{
                        background: `hsl(var(--${hue}) / 0.16)`,
                        color: `hsl(var(--${hue}))`,
                      }}
                    >
                      <Icon className='h-5 w-5' />
                    </span>
                    <span>
                      <span className='block text-sm font-semibold text-foreground'>
                        {title}
                      </span>
                      <span className='mt-0.5 block text-xs text-muted-foreground'>
                        {desc}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className='w-full text-center text-xs text-muted-foreground py-6'>
        <p>Our Family Table • Where memories are made</p>
      </footer>
    </div>
  );
}
