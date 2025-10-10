// OLD RECIPE PAGE - BACKUP
// This file contains the original browse recipes implementation
// Kept for reference during migration to unified Recipe Hub

import { getRecipes, getTags } from '@/lib/data';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeFilter } from '@/components/recipe-filter';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Import } from 'lucide-react';
import Link from 'next/link';

type RecipesPageProps = {
  searchParams?: {
    query?: string;
    tag?: string;
  };
};

export default async function RecipesPageOld({ searchParams }: RecipesPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.query || '';
  const tag = resolvedParams?.tag || '';
  const tags = await getTags();
  const recipes = await getRecipes({ query, tag });

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <h1 className='text-3xl font-extrabold tracking-tight font-headline lg:text-4xl'>
              Browse Recipes
            </h1>
            <p className='text-muted-foreground'>
              Discover our family&apos;s cherished recipes.
            </p>
          </div>
          <Link href="/recipes/import">
            <Button variant="outline" className="gap-2">
              <Import className="h-4 w-4" />
              Import Recipes
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <RecipeFilter tags={tags} />
        
        <Suspense fallback={<RecipeGridSkeleton />}>
          {recipes.length > 0 ? (
            <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <p className='text-lg text-muted-foreground mb-4'>No recipes found</p>
              <p className='text-sm text-muted-foreground'>
                {query
                  ? 'Try adjusting your search terms or filters'
                  : 'Add your first recipe to get started!'}
              </p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}

function RecipeGridSkeleton() {
  return (
    <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className='space-y-3'>
          <Skeleton className='h-48 w-full rounded-lg' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      ))}
    </div>
  );
}
