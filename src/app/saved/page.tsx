'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { RecipeCard } from '@/components/recipe-card';
import { Heart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string;
  prepTime?: number;
  servings?: number;
  course?: string;
  cuisine?: string;
  difficulty?: string;
  summary?: string;
}

export default function SavedRecipesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch('/api/recipes/favorites');
        if (response.ok) {
          const data = await response.json();
          setRecipes(data.recipes || []);
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchFavorites();
    }
  }, [user]);

  if (authLoading || loading) {
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
      <div className='mb-8 space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight font-headline lg:text-4xl'>
          Favorite Recipes
        </h1>
        <p className='text-muted-foreground'>
          Your collection of favorite recipes.
        </p>
      </div>

      {recipes.length > 0 ? (
        <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <Alert className='max-w-xl mx-auto'>
          <Heart className='h-4 w-4' />
          <AlertTitle>No Favorites Yet</AlertTitle>
          <AlertDescription>
            You haven&apos;t saved any favorites yet. Click the heart icon on a
            recipe to add it to this list.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
