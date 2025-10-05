import { getRecipes, getTags } from '@/lib/data';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeFilter } from '@/components/recipe-filter';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type RecipesPageProps = {
  searchParams?: {
    query?: string;
    tag?: string;
  };
};

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.query || '';
  const tag = resolvedParams?.tag || '';
  const tags = await getTags();
  const recipes = await getRecipes({ query, tag });

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-8 space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight font-headline lg:text-4xl'>
          Browse Recipes
        </h1>
        <p className='text-muted-foreground'>
          Discover our family&apos;s cherished recipes.
        </p>
      </div>

      <div className="space-y-6">
        <RecipeFilter tags={tags} />
        
        <Suspense fallback={<RecipeGridSkeleton />}>
          {recipes.length > 0 ? (
            <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className='mt-16 text-center'>
              <h3 className='text-xl font-semibold'>No Recipes Found</h3>
              <p className='text-muted-foreground mt-2'>
                Try adjusting your search or filter criteria.
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
        <div key={i} className='space-y-4'>
          <Skeleton className='h-48 w-full' />
          <div className='space-y-2'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-12 w-full' />
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-6 w-16' />
            <Skeleton className='h-6 w-20' />
          </div>
        </div>
      ))}
    </div>
  );
}
