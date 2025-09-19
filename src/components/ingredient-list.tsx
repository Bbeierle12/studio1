'use client';

import { useState, useTransition } from 'react';
import { useUnit } from '@/context/unit-context';
import { convertIngredientsAction } from '@/app/actions';
import { Button } from './ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { Separator } from './ui/separator';
import { AddToShoppingListButton } from './add-to-shopping-list-button';

type IngredientListProps = {
  ingredients: string;
};

export function IngredientList({ ingredients }: IngredientListProps) {
  const { unit } = useUnit();
  const [convertedIngredients, setConvertedIngredients] = useState<
    string | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertIngredientsAction(ingredients, 'metric');
      if (result.convertedIngredients) {
        setConvertedIngredients(result.convertedIngredients);
      } else {
        // Handle error, maybe show a toast
        console.error(result.error);
      }
    });
  };

  const ingredientsToShow =
    unit === 'metric' && convertedIngredients
      ? convertedIngredients
      : ingredients;
  const showConvertButton = unit === 'metric' && !convertedIngredients;

  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-headline font-semibold'>Ingredients</h2>
        {unit === 'metric' && convertedIngredients && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setConvertedIngredients(null)}
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Revert
          </Button>
        )}
      </div>
      <Separator className='my-4' />

      {showConvertButton && (
        <div className='mb-4'>
          <p className='text-sm text-muted-foreground mb-2'>
            Your preference is set to Metric. Convert this recipe&apos;s
            ingredients?
          </p>
          <Button
            onClick={handleConvert}
            disabled={isPending}
            className='w-full'
          >
            {isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Converting...
              </>
            ) : (
              'Convert to Metric'
            )}
          </Button>
        </div>
      )}

      <ul className='space-y-2 text-muted-foreground'>
        {ingredientsToShow.split('\n').map((line, i) => (
          <li key={i} className='flex items-start'>
            <span className='mr-2 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary print:bg-black' />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <AddToShoppingListButton ingredients={ingredientsToShow} />
    </div>
  );
}
