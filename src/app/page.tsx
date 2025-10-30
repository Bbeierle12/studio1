'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
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
  return (
    <div className='flex-grow'>
      <div className='absolute inset-0 top-[65px] opacity-10'>
        <Image
          src='https://placehold.co/1920x1080/FFFFFF/FFFFFF'
          alt='Cozy family kitchen background'
          fill
          className='object-cover'
          data-ai-hint='warm family kitchen'
        />
      </div>
      <main className='relative flex h-full grow flex-col items-center justify-center p-8'>
        {/* Family Foyer - Simple Hub */}
        <div className='w-full max-w-6xl space-y-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl md:text-4xl font-bold text-white mb-3'>
              Welcome home, {user?.name || 'Friend'}
            </h1>
            <p className='text-lg text-secondary'>
              Your family&apos;s recipe living room
            </p>
          </div>
          
          {/* Simple Hub - The Living Room */}
          <div className='space-y-6'>
            {/* Week Calendar View */}
            <FoyerWeekCalendar />
            
            {/* Quick Action Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Link href='/recipes'>
                <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary/50'>
                  <h3 className='text-lg font-semibold mb-2'>🍳 New Recipes</h3>
                  <p className='text-sm text-muted-foreground'>Discover what to cook</p>
                </div>
              </Link>
              
              <Link href='/collections'>
                <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary/50'>
                  <h3 className='text-lg font-semibold mb-2'>📝 Family Notes</h3>
                  <p className='text-sm text-muted-foreground'>Collections & memories</p>
                </div>
              </Link>
              
              <Link href='/recipes/new'>
                <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary/50'>
                  <h3 className='text-lg font-semibold mb-2'>➕ Add Recipe</h3>
                  <p className='text-sm text-muted-foreground'>Share a family favorite</p>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Quick Access */}
          <div className='text-center mt-8'>
            <p className='text-sm text-secondary mb-3'>Quick access</p>
            <div className='flex gap-3 justify-center flex-wrap'>
              <Button asChild variant='outline' size='sm'>
                <Link href='/saved'>❤️ Favorites</Link>
              </Button>
              <Button asChild variant='outline' size='sm'>
                <Link href='/recipes?tag=seasonal'>🍂 Seasonal</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <footer className='absolute bottom-6 w-full text-center text-xs text-secondary/80'>
        <p>Our Family Table • Where memories are made</p>
      </footer>
    </div>
  );
}
