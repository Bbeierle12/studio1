/**
 * Shopping List Generator Test Suite
 * 
 * Tests shopping list generation functionality.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  generateShoppingList,
  formatShoppingListAsText,
} from '@/lib/shopping-list-generator';

describe('Shopping List Generator', () => {
  describe('generateShoppingList', () => {
    it('should generate shopping list from single meal', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Chicken Pasta',
            ingredients: JSON.stringify([
              '2 cups pasta',
              '1 lb chicken breast',
              '1 cup tomato sauce',
            ]),
          },
          servings: 4,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result.length).toBe(3);
      expect(result.some((item) => item.ingredient.toLowerCase().includes('pasta'))).toBe(true);
      expect(result.some((item) => item.ingredient.toLowerCase().includes('chicken'))).toBe(true);
    });

    it('should consolidate duplicate ingredients', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify(['2 cups milk', '1 cup cheese']),
          },
          servings: 2,
        },
        {
          id: 'meal-2',
          recipe: {
            id: 'recipe-2',
            title: 'Recipe 2',
            ingredients: JSON.stringify(['1 cup milk', '2 cups flour']),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      const milkItems = result.filter((item) =>
        item.ingredient.toLowerCase().includes('milk')
      );
      expect(milkItems.length).toBe(1);
      expect(milkItems[0].recipeIds.length).toBe(2);
      expect(milkItems[0].recipeTitles).toContain('Recipe 1');
      expect(milkItems[0].recipeTitles).toContain('Recipe 2');
    });

    it('should handle empty meals array', () => {
      const result = generateShoppingList([]);
      expect(result).toEqual([]);
    });

    it('should handle meals without recipes', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: null,
          servings: 2,
        },
        {
          id: 'meal-2',
          recipe: {
            id: 'recipe-2',
            title: 'Recipe 2',
            ingredients: JSON.stringify(['1 cup milk']),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result.length).toBe(1);
      expect(result[0].ingredient.toLowerCase()).toContain('milk');
    });

    it('should categorize ingredients correctly', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify([
              '2 cups milk',
              '1 lb chicken',
              '3 tomatoes',
              '2 cups pasta',
            ]),
          },
          servings: 4,
        },
      ];

      const result = generateShoppingList(meals);
      const milk = result.find((item) => item.ingredient.toLowerCase().includes('milk'));
      const chicken = result.find((item) => item.ingredient.toLowerCase().includes('chicken'));
      const tomatoes = result.find((item) => item.ingredient.toLowerCase().includes('tomato'));
      const pasta = result.find((item) => item.ingredient.toLowerCase().includes('pasta'));

      expect(milk?.category).toBe('Dairy & Eggs');
      expect(chicken?.category).toBe('Meat & Seafood');
      expect(tomatoes?.category).toBe('Produce');
      expect(pasta?.category).toBe('Grains & Bread');
    });

    it('should sort items by category and name', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify([
              '1 lb chicken',
              '2 apples',
              '1 cup milk',
              '3 bananas',
            ]),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      // Check that items are sorted by category
      const categories = result.map((item) => item.category);
      const uniqueCategories = Array.from(new Set(categories));
      expect(categories).toEqual([...categories].sort());
    });

    it('should handle invalid JSON in ingredients', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: 'invalid json',
          },
          servings: 2,
        },
        {
          id: 'meal-2',
          recipe: {
            id: 'recipe-2',
            title: 'Recipe 2',
            ingredients: JSON.stringify(['1 cup milk']),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      // Should still work for valid recipe
      expect(result.length).toBe(1);
      expect(result[0].ingredient.toLowerCase()).toContain('milk');
    });

    it('should parse ingredient quantities correctly', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify([
              '2 cups milk',
              '1/2 tsp salt',
              '3 tablespoons olive oil',
            ]),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result.length).toBe(3);
      
      const milk = result.find((item) => item.ingredient.toLowerCase().includes('milk'));
      expect(milk?.quantity).toContain('2');
      expect(milk?.unit).toBe('cups');
    });

    it('should handle ingredients without quantities', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify([
              'Salt to taste',
              'Black pepper',
              '2 cups water',
            ]),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result.length).toBe(3);
      
      const salt = result.find((item) => item.ingredient.toLowerCase().includes('salt'));
      const pepper = result.find((item) => item.ingredient.toLowerCase().includes('pepper'));
      
      expect(salt).toBeDefined();
      expect(pepper).toBeDefined();
    });

    it('should track which recipes use each ingredient', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Pasta',
            ingredients: JSON.stringify(['2 cups pasta', '1 cup cheese']),
          },
          servings: 2,
        },
        {
          id: 'meal-2',
          recipe: {
            id: 'recipe-2',
            title: 'Pizza',
            ingredients: JSON.stringify(['2 cups cheese', '1 cup flour']),
          },
          servings: 4,
        },
      ];

      const result = generateShoppingList(meals);
      const cheese = result.find((item) => item.ingredient.toLowerCase().includes('cheese'));
      
      expect(cheese?.recipeIds).toContain('recipe-1');
      expect(cheese?.recipeIds).toContain('recipe-2');
      expect(cheese?.recipeTitles).toContain('Pasta');
      expect(cheese?.recipeTitles).toContain('Pizza');
    });

    it('should initialize items as unchecked', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify(['2 cups milk']),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result[0].isChecked).toBe(false);
    });
  });

  describe('formatShoppingListAsText', () => {
    it('should format shopping list as text', () => {
      const items = [
        {
          ingredient: 'milk',
          quantity: '2',
          unit: 'cups',
          category: 'Dairy & Eggs',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
        {
          ingredient: 'chicken breast',
          quantity: '1',
          unit: 'lb',
          category: 'Meat & Seafood',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
      ];

      const result = formatShoppingListAsText(items);
      expect(result).toContain('SHOPPING LIST');
      expect(result).toContain('DAIRY & EGGS');
      expect(result).toContain('MEAT & SEAFOOD');
      expect(result).toContain('milk');
      expect(result).toContain('chicken breast');
    });

    it('should show checkmarks for checked items', () => {
      const items = [
        {
          ingredient: 'milk',
          quantity: '2',
          unit: 'cups',
          category: 'Dairy & Eggs',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: true,
        },
        {
          ingredient: 'cheese',
          quantity: '1',
          unit: 'cup',
          category: 'Dairy & Eggs',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
      ];

      const result = formatShoppingListAsText(items);
      expect(result).toContain('✓ milk');
      expect(result).toContain('☐ cheese');
    });

    it('should handle empty shopping list', () => {
      const result = formatShoppingListAsText([]);
      expect(result).toContain('SHOPPING LIST');
      expect(result).toContain('Generated by Our Family Table');
    });

    it('should include quantities and units in text', () => {
      const items = [
        {
          ingredient: 'milk',
          quantity: '2',
          unit: 'cups',
          category: 'Dairy & Eggs',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
      ];

      const result = formatShoppingListAsText(items);
      expect(result).toContain('(2 cups)');
    });

    it('should handle items without units', () => {
      const items = [
        {
          ingredient: 'eggs',
          quantity: '6',
          unit: '',
          category: 'Dairy & Eggs',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
      ];

      const result = formatShoppingListAsText(items);
      expect(result).toContain('eggs');
      // Should not show empty parentheses
      expect(result).not.toContain('()');
    });

    it('should group items by category', () => {
      const items = [
        {
          ingredient: 'milk',
          quantity: '2',
          unit: 'cups',
          category: 'Dairy & Eggs',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
        {
          ingredient: 'cheese',
          quantity: '1',
          unit: 'cup',
          category: 'Dairy & Eggs',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
        {
          ingredient: 'chicken',
          quantity: '1',
          unit: 'lb',
          category: 'Meat & Seafood',
          recipeIds: ['recipe-1'],
          recipeTitles: ['Recipe 1'],
          isChecked: false,
        },
      ];

      const result = formatShoppingListAsText(items);
      
      // Check that categories are present
      expect(result).toContain('DAIRY & EGGS');
      expect(result).toContain('MEAT & SEAFOOD');
      
      // Check that items are under their categories
      const dairyIndex = result.indexOf('DAIRY & EGGS');
      const meatIndex = result.indexOf('MEAT & SEAFOOD');
      const milkIndex = result.indexOf('milk');
      const cheeseIndex = result.indexOf('cheese');
      const chickenIndex = result.indexOf('chicken');
      
      expect(milkIndex).toBeGreaterThan(dairyIndex);
      expect(cheeseIndex).toBeGreaterThan(dairyIndex);
      expect(chickenIndex).toBeGreaterThan(meatIndex);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in ingredient names', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify([
              '2 cups "special" milk',
              "1 lb chef's chicken",
            ]),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very long ingredient lists', () => {
      const longIngredientList = Array.from({ length: 50 }, (_, i) => `${i + 1} cup ingredient-${i}`);
      
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Complex Recipe',
            ingredients: JSON.stringify(longIngredientList),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result.length).toBe(50);
    });

    it('should handle fractional quantities', () => {
      const meals = [
        {
          id: 'meal-1',
          recipe: {
            id: 'recipe-1',
            title: 'Recipe 1',
            ingredients: JSON.stringify([
              '1/2 cup flour',
              '1/4 tsp salt',
              '2 1/2 cups sugar',
            ]),
          },
          servings: 2,
        },
      ];

      const result = generateShoppingList(meals);
      expect(result.length).toBe(3);
      
      const flour = result.find((item) => item.ingredient.toLowerCase().includes('flour'));
      expect(flour?.quantity).toContain('1/2');
    });
  });
});
