import { NextResponse } from 'next/server';
import { getTags, getRecipes } from '@/lib/data';
import type { Recipe } from '@/lib/types';

async function getCoverImageForTag(tag: string, recipes: Recipe[]) {
  const recipeWithTag = recipes.find((recipe) => recipe.tags.includes(tag));
  return recipeWithTag
    ? { url: recipeWithTag.imageUrl, hint: recipeWithTag.imageHint }
    : {
        url: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
        hint: 'food collection',
      };
}

export async function GET() {
  try {
    const tags = await getTags();
    const recipes = await getRecipes();

    const collections = await Promise.all(
      tags.map(async (tag) => {
        const recipesInCollection = recipes.filter((r) =>
          r.tags.includes(tag)
        );
        const cover = await getCoverImageForTag(tag, recipesInCollection);
        return {
          name: tag,
          count: recipesInCollection.length,
          coverImage: cover.url,
          imageHint: cover.hint,
        };
      })
    );

    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}
