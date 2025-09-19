'use client';

import { useSavedRecipes } from '@/context/saved-recipes-context';
import { Button } from './ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { useEffect, useState } from 'react';

type SaveRecipeButtonProps = {
  recipe: Recipe;
};

export function SaveRecipeButton({ recipe }: SaveRecipeButtonProps) {
  const { saveRecipe, removeRecipe, isRecipeSaved } = useSavedRecipes();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a disabled placeholder on the server
    return (
      <Button variant='outline' size='sm' disabled>
        <Bookmark className='mr-2 h-4 w-4' /> Save Offline
      </Button>
    );
  }

  const saved = isRecipeSaved(recipe.id);

  const handleToggle = () => {
    if (saved) {
      removeRecipe(recipe.id);
    } else {
      saveRecipe(recipe);
    }
  };

  return (
    <Button onClick={handleToggle} variant='outline' size='sm'>
      {saved ? (
        <>
          <BookmarkCheck className='mr-2 h-4 w-4 text-green-500' />
          Saved
        </>
      ) : (
        <>
          <Bookmark className='mr-2 h-4 w-4' />
          Save Offline
        </>
      )}
    </Button>
  );
}
