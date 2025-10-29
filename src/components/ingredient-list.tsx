'use client';

import { useUnit } from '@/context/unit-context';
import { Separator } from './ui/separator';
import { AddToShoppingListButton } from './add-to-shopping-list-button';

type IngredientListProps = {
  ingredients: string;
};

export function IngredientList({ ingredients }: IngredientListProps) {
  const { unit } = useUnit();

  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-headline font-semibold'>Ingredients</h2>
      </div>
      <Separator className='my-4' />

      <ul className='space-y-2 text-muted-foreground'>
        {ingredients.split('\n').map((line: string, i: number) => (
          <li key={i} className='flex items-start'>
            <span className='mr-2 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary print:bg-black' />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <AddToShoppingListButton ingredients={ingredients} />
    </div>
  );
}
