'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Calendar, Heart, Plus } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className='flex min-h-[80vh] items-center justify-center'>
        <div className='animate-pulse text-lg text-muted-foreground'>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Welcome */}
        <div className='text-center'>
          <h1 className='text-3xl md:text-4xl font-bold mb-3'>
            Welcome, {user?.name || 'Friend'}!
          </h1>
          <p className='text-lg text-muted-foreground'>
            What would you like to do today?
          </p>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Link href='/recipes/new'>
            <div className='bg-card rounded-lg p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border'>
              <div className='flex items-center gap-3 mb-3'>
                <Plus className='h-6 w-6 text-primary' />
                <h3 className='text-lg font-semibold'>Add Recipe</h3>
              </div>
              <p className='text-sm text-muted-foreground'>
                Create a new recipe from scratch
              </p>
            </div>
          </Link>

          <Link href='/recipes'>
            <div className='bg-card rounded-lg p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border'>
              <div className='flex items-center gap-3 mb-3'>
                <UtensilsCrossed className='h-6 w-6 text-primary' />
                <h3 className='text-lg font-semibold'>Browse Recipes</h3>
              </div>
              <p className='text-sm text-muted-foreground'>
                View all your saved recipes
              </p>
            </div>
          </Link>

          <Link href='/meal-plan'>
            <div className='bg-card rounded-lg p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border'>
              <div className='flex items-center gap-3 mb-3'>
                <Calendar className='h-6 w-6 text-primary' />
                <h3 className='text-lg font-semibold'>Meal Plan</h3>
              </div>
              <p className='text-sm text-muted-foreground'>
                Plan your meals for the week
              </p>
            </div>
          </Link>

          <Link href='/saved'>
            <div className='bg-card rounded-lg p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border'>
              <div className='flex items-center gap-3 mb-3'>
                <Heart className='h-6 w-6 text-primary' />
                <h3 className='text-lg font-semibold'>Favorites</h3>
              </div>
              <p className='text-sm text-muted-foreground'>
                Quick access to your favorite recipes
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Links */}
        <div className='text-center'>
          <p className='text-sm text-muted-foreground mb-3'>Or try these:</p>
          <div className='flex gap-3 justify-center flex-wrap'>
            <Button asChild variant='outline' size='sm'>
              <Link href='/recipes/import'>Import Recipe</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
