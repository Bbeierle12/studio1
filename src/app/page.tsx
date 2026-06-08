'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FoyerWeekCalendar } from '@/components/foyer/foyer-week-calendar';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [weather, setWeather] = useState<{
    temperature: number;
    condition: string;
    humidity?: number;
  } | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

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

  // Fetch weather on component mount
  useEffect(() => {
    async function fetchWeather() {
      try {
        // Get user's location
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Mock weather data for now (replace with real API call)
              // You can integrate with OpenWeatherMap, WeatherAPI, etc.
              const mockWeather = {
                temperature: 72,
                condition: 'Sunny',
                humidity: 45
              };
              
              setWeather(mockWeather);
            },
            (error) => {
              console.error('Error getting location:', error);
              // Set default weather if location fails
              setWeather({
                temperature: 70,
                condition: 'Clear',
                humidity: 50
              });
            }
          );
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      }
    }
    
    if (user) {
      fetchWeather();
    }
  }, [user]);

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

  return (
    <div className='flex-grow'>
      <main className='relative flex grow flex-col items-center p-4 md:p-8'>
        {/* Family Foyer - Simple Hub */}
        <div className='w-full max-w-6xl space-y-8'>
          {/* Welcome hero — tokened warm gradient (white text sits on the brand
              gradient, not a white box) */}
          <section className='relative overflow-hidden rounded-[20px] p-8 shadow-md3-2 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(24_46%_22%)_100%)]'>
            <div className='absolute inset-0 bg-[radial-gradient(110%_90%_at_85%_0%,hsl(var(--meal-breakfast)/0.28)_0%,transparent_55%)]' />
            <div className='relative text-center'>
              <h1 className='font-headline text-3xl md:text-4xl font-bold text-white mb-2'>
                {greeting}, {user?.name || 'Friend'}
              </h1>
              <p className='text-lg text-white/80'>
                Your family&apos;s recipe living room
              </p>
            </div>
          </section>

          {/* Simple Hub - The Living Room */}
          <div className='space-y-6'>
            {/* Week Calendar View */}
            <FoyerWeekCalendar />

            {/* Quick Action Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Link href='/recipes' className='block h-full'>
                <div className='h-full bg-card border border-border rounded-lg p-6 shadow-md3-1 hover:shadow-md3-3 transition-all hover:border-primary/50 cursor-pointer'>
                  <h3 className='font-headline text-lg font-semibold mb-2'>New Recipes</h3>
                  <p className='text-sm text-muted-foreground'>Discover what to cook</p>
                </div>
              </Link>

              <Link href='/recipes' className='block h-full'>
                <div className='h-full bg-card border border-border rounded-lg p-6 shadow-md3-1 hover:shadow-md3-3 transition-all hover:border-primary/50 cursor-pointer'>
                  <h3 className='font-headline text-lg font-semibold mb-2'>Family Notes</h3>
                  <p className='text-sm text-muted-foreground'>Collections & memories</p>
                </div>
              </Link>

              <div className='h-full bg-card border border-dashed border-border rounded-lg p-6 opacity-70'>
                <h3 className='font-headline text-lg font-semibold mb-2'>Cookbook Format</h3>
                <p className='text-sm text-muted-foreground'>Coming soon…</p>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className='text-center'>
            <p className='text-sm text-muted-foreground mb-3'>Quick access</p>
            <div className='flex gap-3 justify-center flex-wrap'>
              <Button asChild variant='outline' size='sm'>
                <Link href='/saved'>Favorites</Link>
              </Button>
              <Button asChild variant='outline' size='sm'>
                <Link href='/recipes?tag=seasonal'>Seasonal</Link>
              </Button>
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
