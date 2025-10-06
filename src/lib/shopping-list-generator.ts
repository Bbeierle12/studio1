/**
 * Shopping List Generator
 * Consolidates ingredients from multiple recipes into a categorized shopping list
 */

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

interface RecipeIngredient {
  recipeId: string;
  recipeTitle: string;
  ingredient: string;
}

interface ShoppingListItem {
  ingredient: string;
  quantity: string;
  unit: string;
  category: string;
  recipeIds: string[];
  recipeTitles: string[];
  isChecked: boolean;
}

// Category mapping for common ingredients
const INGREDIENT_CATEGORIES: Record<string, string> = {
  // Produce
  'lettuce': 'Produce',
  'tomato': 'Produce',
  'onion': 'Produce',
  'garlic': 'Produce',
  'pepper': 'Produce',
  'cucumber': 'Produce',
  'carrot': 'Produce',
  'broccoli': 'Produce',
  'spinach': 'Produce',
  'potato': 'Produce',
  'avocado': 'Produce',
  'lemon': 'Produce',
  'lime': 'Produce',
  'apple': 'Produce',
  'banana': 'Produce',
  'ginger': 'Produce',
  'cilantro': 'Produce',
  'parsley': 'Produce',
  'celery': 'Produce',
  'mint': 'Produce',
  
  // Meat & Seafood
  'chicken': 'Meat & Seafood',
  'beef': 'Meat & Seafood',
  'pork': 'Meat & Seafood',
  'turkey': 'Meat & Seafood',
  'fish': 'Meat & Seafood',
  'salmon': 'Meat & Seafood',
  'shrimp': 'Meat & Seafood',
  'bacon': 'Meat & Seafood',
  'sausage': 'Meat & Seafood',
  
  // Dairy & Eggs
  'milk': 'Dairy & Eggs',
  'cheese': 'Dairy & Eggs',
  'butter': 'Dairy & Eggs',
  'yogurt': 'Dairy & Eggs',
  'cream': 'Dairy & Eggs',
  'egg': 'Dairy & Eggs',
  'sour cream': 'Dairy & Eggs',
  'feta': 'Dairy & Eggs',
  'parmesan': 'Dairy & Eggs',
  'mozzarella': 'Dairy & Eggs',
  
  // Grains & Bread
  'bread': 'Grains & Bread',
  'pasta': 'Grains & Bread',
  'rice': 'Grains & Bread',
  'flour': 'Grains & Bread',
  'tortilla': 'Grains & Bread',
  'noodle': 'Grains & Bread',
  'oats': 'Grains & Bread',
  'cereal': 'Grains & Bread',
  
  // Canned & Packaged
  'beans': 'Canned & Packaged',
  'tomatoes': 'Canned & Packaged',
  'broth': 'Canned & Packaged',
  'stock': 'Canned & Packaged',
  'soup': 'Canned & Packaged',
  
  // Condiments & Spices
  'salt': 'Condiments & Spices',
  'black pepper': 'Condiments & Spices',
  'oil': 'Condiments & Spices',
  'vinegar': 'Condiments & Spices',
  'soy sauce': 'Condiments & Spices',
  'ketchup': 'Condiments & Spices',
  'mustard': 'Condiments & Spices',
  'mayo': 'Condiments & Spices',
  'oregano': 'Condiments & Spices',
  'dried basil': 'Condiments & Spices',
  'cumin': 'Condiments & Spices',
  'paprika': 'Condiments & Spices',
  'cinnamon': 'Condiments & Spices',
  'salsa': 'Condiments & Spices',
};

/**
 * Categorize an ingredient based on its name
 */
function categorizeIngredient(ingredientText: string): string {
  const lowerText = ingredientText.toLowerCase();
  
  for (const [keyword, category] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (lowerText.includes(keyword)) {
      return category;
    }
  }
  
  return 'Other';
}

/**
 * Parse ingredient string to extract quantity, unit, and name
 * Examples:
 *   "2 cups milk" -> { quantity: "2", unit: "cups", name: "milk" }
 *   "1 lb chicken breast" -> { quantity: "1", unit: "lb", name: "chicken breast" }
 */
function parseIngredient(ingredientText: string): { quantity: string; unit: string; name: string } {
  // Remove leading/trailing whitespace
  const text = ingredientText.trim();
  
  // Match patterns like "1 cup", "2 tablespoons", "1/2 tsp", etc.
  const pattern = /^([\d\/\.\s]+)\s*([a-zA-Z]+)?\s+(.+)$/;
  const match = text.match(pattern);
  
  if (match) {
    const [, quantity, unit, name] = match;
    return {
      quantity: quantity.trim(),
      unit: unit?.trim() || '',
      name: name.trim()
    };
  }
  
  // If no quantity/unit found, treat entire string as ingredient name
  return {
    quantity: '1',
    unit: '',
    name: text
  };
}

/**
 * Consolidate duplicate ingredients
 * For now, we'll just combine items with the same name
 * Future enhancement: actually add quantities together
 */
function consolidateIngredients(items: RecipeIngredient[]): ShoppingListItem[] {
  const consolidatedMap = new Map<string, ShoppingListItem>();
  
  for (const item of items) {
    const parsed = parseIngredient(item.ingredient);
    const key = parsed.name.toLowerCase();
    
    if (consolidatedMap.has(key)) {
      const existing = consolidatedMap.get(key)!;
      existing.recipeIds.push(item.recipeId);
      existing.recipeTitles.push(item.recipeTitle);
      // For now, just append quantities (future: actually add them)
      if (parsed.quantity !== '1' || parsed.unit) {
        existing.quantity += ` + ${parsed.quantity}`;
      }
    } else {
      consolidatedMap.set(key, {
        ingredient: parsed.name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        category: categorizeIngredient(parsed.name),
        recipeIds: [item.recipeId],
        recipeTitles: [item.recipeTitle],
        isChecked: false
      });
    }
  }
  
  return Array.from(consolidatedMap.values());
}

/**
 * Generate shopping list from planned meals
 */
export function generateShoppingList(
  meals: Array<{
    id: string;
    recipe?: {
      id: string;
      title: string;
      ingredients: string; // JSON string array
    } | null;
    servings: number;
  }>
): ShoppingListItem[] {
  // Extract all ingredients from recipes
  const allIngredients: RecipeIngredient[] = [];
  
  for (const meal of meals) {
    if (meal.recipe) {
      try {
        const ingredients = JSON.parse(meal.recipe.ingredients) as string[];
        for (const ingredient of ingredients) {
          allIngredients.push({
            recipeId: meal.recipe.id,
            recipeTitle: meal.recipe.title,
            ingredient
          });
        }
      } catch (error) {
        console.error(`Failed to parse ingredients for recipe ${meal.recipe.id}`, error);
      }
    }
  }
  
  // Consolidate duplicate ingredients
  const consolidated = consolidateIngredients(allIngredients);
  
  // Sort by category, then by ingredient name
  consolidated.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.ingredient.localeCompare(b.ingredient);
  });
  
  return consolidated;
}

/**
 * Format shopping list as plain text for copying/printing
 */
export function formatShoppingListAsText(items: ShoppingListItem[]): string {
  const groupedByCategory: Record<string, ShoppingListItem[]> = {};
  
  // Group items by category
  for (const item of items) {
    if (!groupedByCategory[item.category]) {
      groupedByCategory[item.category] = [];
    }
    groupedByCategory[item.category].push(item);
  }
  
  // Format as text
  let text = '🛒 SHOPPING LIST\n';
  text += '═══════════════════════════════════════\n\n';
  
  for (const [category, categoryItems] of Object.entries(groupedByCategory)) {
    text += `${category.toUpperCase()}\n`;
    text += '─────────────────────────────────────\n';
    
    for (const item of categoryItems) {
      const checkmark = item.isChecked ? '✓' : '☐';
      const quantityStr = item.quantity && item.unit 
        ? `${item.quantity} ${item.unit}` 
        : item.quantity || '';
      text += `${checkmark} ${item.ingredient}`;
      if (quantityStr) {
        text += ` (${quantityStr})`;
      }
      text += '\n';
    }
    text += '\n';
  }
  
  text += '\nGenerated by Our Family Table\n';
  
  return text;
}
