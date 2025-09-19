'use client';

import { useShoppingList } from '@/context/shopping-list-context';
import { Button } from './ui/button';
import { ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AddToShoppingListButtonProps = {
  ingredients: string;
};

export function AddToShoppingListButton({ ingredients }: AddToShoppingListButtonProps) {
  const { addIngredients } = useShoppingList();
  const { toast } = useToast();

  const handleAdd = () => {
    const ingredientList = ingredients.split('\n').filter(line => line.trim() !== '');
    addIngredients(ingredientList);
    toast({
      title: 'Ingredients Added',
      description: `${ingredientList.length} items were added to your shopping list.`,
    });
  };

  return (
    <Button onClick={handleAdd} className="mt-4 w-full" variant="outline">
      <ShoppingCart className="mr-2 h-4 w-4" />
      Add to Shopping List
    </Button>
  );
}
