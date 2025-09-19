import { getTags, getRecipes } from '@/lib/data';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Tag } from 'lucide-react';
import Image from 'next/image';
import type { Recipe } from '@/lib/types';

async function getCoverImageForTag(tag: string, recipes: Recipe[]) {
  const recipeWithTag = recipes.find(recipe => recipe.tags.includes(tag));
  return recipeWithTag
    ? { url: recipeWithTag.imageUrl, hint: recipeWithTag.imageHint }
    : {
        url: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
        hint: 'food collection',
      };
}

export default async function CollectionsPage() {
  const tags = await getTags();
  const recipes = await getRecipes();

  const collections = await Promise.all(
    tags.map(async tag => {
      const recipesInCollection = recipes.filter(r => r.tags.includes(tag));
      const cover = await getCoverImageForTag(tag, recipesInCollection);
      return {
        name: tag,
        count: recipesInCollection.length,
        coverImage: cover.url,
        imageHint: cover.hint,
      };
    })
  );

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-8 space-y-2'>
        <h1 className='text-3xl font-extrabold tracking-tight font-headline lg:text-4xl'>
          Recipe Collections
        </h1>
        <p className='text-muted-foreground'>Explore recipes grouped by tag.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {collections.map(collection => (
          <Link
            key={collection.name}
            href={`/recipes?tag=${collection.name}`}
            className='group block'
          >
            <Card className='flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50'>
              <div className='relative aspect-video overflow-hidden'>
                <Image
                  src='https://placehold.co/600x400/FFFFFF/FFFFFF'
                  alt={collection.name}
                  width={600}
                  height={400}
                  data-ai-hint={collection.imageHint}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
                <div className='absolute bottom-4 left-4'>
                  <h2 className='text-2xl font-headline font-bold text-white capitalize'>
                    {collection.name}
                  </h2>
                </div>
              </div>
              <CardContent className='pt-4'>
                <p className='text-sm text-muted-foreground'>
                  {collection.count}{' '}
                  {collection.count === 1 ? 'recipe' : 'recipes'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
