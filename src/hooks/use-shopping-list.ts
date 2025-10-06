import { useQuery } from '@tanstack/react-query';
import { generateShoppingList } from '@/lib/shopping-list-generator';
import { MealPlan } from '@/lib/types';

interface ShoppingListItem {
  ingredient: string;
  quantity: string;
  unit: string;
  category: string;
  recipeIds: string[];
  recipeTitles: string[];
  isChecked: boolean;
}

export function useShoppingList(mealPlan: MealPlan | null) {
  return useQuery<ShoppingListItem[]>({
    queryKey: ['shoppingList', mealPlan?.id],
    queryFn: () => {
      if (!mealPlan || !mealPlan.meals) {
        return [];
      }

      // Generate shopping list from meals
      return generateShoppingList(mealPlan.meals);
    },
    enabled: !!mealPlan,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
