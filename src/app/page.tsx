'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import MediaUpload from '@/components/media-upload';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [weather, setWeather] = useState<{
    temperature: number;
    condition: string;
    humidity?: number;
  } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
  if (loading) {
    return (
      <div className='flex min-h-[80vh] items-center justify-center'>
        <div className='animate-pulse text-lg text-muted-foreground'>
          Loading...
        </div>
      </div>
    );
  }

  // If not authenticated, redirect is happening
  if (!user) {
    return null;
  }

  // Authenticated user - show main dashboard
  return (
    <div className='flex-grow'>
      <div className='absolute inset-0 top-[65px] opacity-10'>
        <Image
          src='https://placehold.co/1920x1080/FFFFFF/FFFFFF'
          alt='Gnomes in a kitchen sketch background'
          fill
          className='object-cover'
          data-ai-hint='gnomes kitchen'
        />
      </div>
      <main className='relative flex h-full grow flex-col items-center justify-center p-8 text-center'>
        {/* User is logged in - show welcome message and tabs */}
        <div className='w-full max-w-4xl space-y-6'>
          <div className='text-center mb-6'>
            <h2 className='text-2xl font-bold text-white mb-2'>
              Welcome back, {user?.name || 'Chef'}!
            </h2>
            <p className='text-secondary'>
              Ready to discover today&apos;s perfect recipes?
            </p>
          </div>
          
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="home" className="space-y-4">
              <div className='space-y-6'>
                <Button
                  asChild
                  className='w-full max-w-md mx-auto transform transition-transform hover:scale-105'
                  size='lg'
                >
                  <Link href='/recipes'>Browse Weather-Smart Recipes</Link>
                </Button>
                
                <div className='grid grid-cols-2 gap-3 max-w-md mx-auto'>
                  <Button
                    asChild
                    variant='secondary'
                    className='w-full transition-colors'
                    size='lg'
                  >
                    <Link href='/recipes/new'>Add Recipe</Link>
                  </Button>
                  
                  <Button
                    asChild
                    variant='outline'  
                    className='w-full transition-colors'
                    size='lg'
                  >
                    <Link href='/saved'>My Favorites</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="browse">
              <div className="text-center">
                <p className="text-white mb-4">Weather-based recipe recommendations coming soon!</p>
                <Button asChild>
                  <Link href='/recipes'>Browse All Recipes</Link>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="upload">
              <MediaUpload />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <footer className='absolute bottom-8 w-full text-center text-sm text-secondary'>
        <p>© 2024 Our Family Table. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
