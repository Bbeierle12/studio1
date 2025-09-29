'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import MediaUpload from '@/components/media-upload';
import VoiceAssistant from '@/components/voice-assistant';
import { useState } from 'react';

export default function Home() {
  const { user, loading } = useAuth();

  // Show cobblestone arch background when user is not logged in
  if (!loading && !user) {
    return (
      <div className='cobblestone-arch-background flex-grow'>
        {/* Cobblestone arch with vines overlay */}
        <div className="cobblestone-arch"></div>
        <div className="vine-overlay"></div>
        <div className="vine-details"></div>

        {/* Content container */}
        <div className="relative z-20 flex items-center justify-center min-h-[80vh] p-4">
          <div className="text-center space-y-8">
            <div>
              <h1 className='mb-2 font-headline text-6xl font-bold text-white drop-shadow-lg'>
                Our Family Table
              </h1>
              <p className='text-xl text-secondary drop-shadow-md mb-8'>
                Preserving culinary heritage, one recipe at a time.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                <Link href="/register">
                  Start Preserving Recipes
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Demo/Guest Access */}
            <div className="pt-6">
              <Button asChild variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Link href="/recipes">
                  Browse Recipes as Guest
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <footer className='absolute bottom-8 w-full text-center text-sm text-white drop-shadow-md z-20'>
          <p>© 2024 Our Family Table. All Rights Reserved.</p>
        </footer>
      </div>
    );
  }  // Loading state
  if (loading) {
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
          <div className='w-full max-w-md space-y-4'>
            <Button
              className='w-full transform transition-transform hover:scale-105'
              size='lg'
              disabled
            >
              Loading...
            </Button>
          </div>
        </main>
        <footer className='absolute bottom-8 w-full text-center text-sm text-secondary'>
          <p>© 2024 Our Family Table. All Rights Reserved.</p>
        </footer>
      </div>
    );
  }

  // Regular background for logged in users
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
                {/* Voice Assistant */}
                <div className='w-full max-w-md mx-auto'>
                  <VoiceAssistant />
                </div>
                
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
