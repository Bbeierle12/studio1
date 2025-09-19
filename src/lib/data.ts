// This file acts as a mock database for development purposes.
'use server';

import type { Recipe, User } from './types';

const globalForData = global as unknown as {
  recipes: Recipe[] | undefined;
  users: User[] | undefined;
};

const initialUsers: User[] = [
  { id: '1', name: 'Grandma Maria', avatarUrl: 'https://i.pravatar.cc/150?u=maria' },
  { id: '2', name: 'Uncle Bob', avatarUrl: 'https://i.pravatar.cc/150?u=bob' },
  { id: '3', name: 'Cousin Clara', avatarUrl: 'https://i.pravatar.cc/150?u=clara' },
];

const initialRecipes: Recipe[] = [
  {
    id: '1',
    title: "Grandma's Classic Lasagna",
    contributor: 'Grandma Maria',
    ingredients: '1 lb ground beef\n1/2 cup chopped onion\n2 cloves garlic, minced\n1 (28 ounce) can crushed tomatoes\n2 (6.5 ounce) cans tomato sauce\n1/2 cup water\n2 teaspoons sugar\n1 1/2 teaspoons dried basil leaves\n1/2 teaspoon salt\n1/4 teaspoon black pepper\n12 lasagna noodles\n16 ounces ricotta cheese\n1 egg\n3/4 cup grated Parmesan cheese\n1 pound mozzarella cheese, sliced',
    instructions: '1. In a large skillet, cook ground beef, onion, and garlic over medium heat until browned. Drain fat. Stir in crushed tomatoes, tomato sauce, water, sugar, basil, salt, and pepper. Bring to a boil, reduce heat, and simmer for 30 minutes.\n2. Cook lasagna noodles according to package directions. Drain.\n3. In a small bowl, combine ricotta cheese, egg, and 1/4 cup Parmesan cheese. Mix well.\n4. Preheat oven to 375°F (190°C). To assemble, spread 1 cup of meat sauce in the bottom of a 9x13 inch baking dish. Layer with 4 noodles, half of the ricotta mixture, and 1/3 of the mozzarella slices. Repeat layers. Top with remaining 4 noodles, meat sauce, mozzarella, and Parmesan cheese.\n5. Bake for 30-40 minutes, or until bubbly. Let stand for 10 minutes before serving.',
    imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
    imageHint: 'lasagna pasta',
    tags: ['dinner', 'italian'],
    summary: 'A heartwarming, classic lasagna recipe passed down through generations, featuring rich meat sauce, creamy ricotta, and layers of melted mozzarella. Perfect for family gatherings.',
    story: "This lasagna recipe has been in our family for over 70 years, brought over from the old country by my great-grandmother. Every Sunday, the whole family would gather at her house, and the smell of this lasagna baking would fill every room. It's more than just a meal; it's a tradition that brings us all together.",
    prepTime: 90,
    servings: 8,
    course: 'Main',
    cuisine: 'Italian',
    difficulty: 'Medium',
  },
  {
    id: '2',
    title: 'Fluffy Buttermilk Pancakes',
    contributor: 'Uncle Bob',
    ingredients: '2 cups all-purpose flour\n2 teaspoons baking powder\n1 teaspoon baking soda\n1/2 teaspoon salt\n3 tablespoons sugar\n2 large eggs, lightly beaten\n3 cups buttermilk\n4 tablespoons unsalted butter, melted',
    instructions: '1. In a large bowl, whisk together flour, baking powder, baking soda, salt, and sugar.\n2. In a separate bowl, whisk together eggs and buttermilk. Pour the wet ingredients into the dry ingredients and whisk until just combined (do not overmix).\n3. Stir in the melted butter.\n4. Heat a lightly oiled griddle or frying pan over medium-high heat. Pour or scoop the batter onto the griddle, using approximately 1/4 cup for each pancake. Cook until bubbles appear on the surface and the edges are dry, about 2-3 minutes. Flip and cook until browned on the other side. Serve immediately with syrup and your favorite toppings.',
    imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
    imageHint: 'pancakes breakfast',
    tags: ['breakfast', 'american'],
    summary: 'A foolproof recipe for incredibly fluffy and tender buttermilk pancakes. Simple to make and always a crowd-pleaser for a weekend breakfast or brunch.',
    story: "Uncle Bob was famous for his Saturday morning pancakes. He'd always make funny shapes for the kids and would never, ever share his 'secret ingredient' (which we all knew was a little extra butter).",
    prepTime: 20,
    servings: 4,
    course: 'Breakfast',
    cuisine: 'American',
    difficulty: 'Easy',
  },
  {
    id: '3',
    title: 'Vibrant Summer Salad',
    contributor: 'Cousin Clara',
    ingredients: '1 head of romaine lettuce, chopped\n1 cup cherry tomatoes, halved\n1 cucumber, sliced\n1/2 red onion, thinly sliced\n1/4 cup crumbled feta cheese\nFor the dressing:\n1/4 cup olive oil\n2 tablespoons lemon juice\n1 teaspoon Dijon mustard\nSalt and pepper to taste',
    instructions: '1. In a large salad bowl, combine the chopped romaine, cherry tomatoes, cucumber, and red onion.\n2. In a small jar or bowl, whisk together the olive oil, lemon juice, Dijon mustard, salt, and pepper to create the dressing.\n3. Pour the dressing over the salad and toss gently to coat.\n4. Sprinkle with crumbled feta cheese just before serving.',
    imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
    imageHint: 'salad bowl',
    tags: ['lunch', 'healthy'],
    summary: 'A crisp, refreshing, and colorful summer salad with a zesty lemon-dijon vinaigrette. Easily customizable with your favorite veggies and proteins.',
    story: '',
    prepTime: 15,
    servings: 2,
    course: 'Side',
    cuisine: 'Other',
    difficulty: 'Easy',
  },
];

globalForData.users = globalForData.users ?? initialUsers;
globalForData.recipes = globalForData.recipes ?? initialRecipes;

export const getUsers = async (): Promise<User[]> => {
  return globalForData.users!;
};

export const getRecipes = async (
  { query, tag }: { query?: string; tag?: string } = {}
): Promise<Recipe[]> => {
  let recipes = globalForData.recipes!;

  if (query) {
    const lowerCaseQuery = query.toLowerCase();
    recipes = recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(lowerCaseQuery) ||
      recipe.ingredients.toLowerCase().includes(lowerCaseQuery) ||
      recipe.summary.toLowerCase().includes(lowerCaseQuery)
    );
  }

  if (tag) {
    recipes = recipes.filter(recipe => recipe.tags.includes(tag.toLowerCase()));
  }

  return recipes.sort((a, b) => (a.title > b.title ? 1 : -1));
};

export const getRecipeById = async (id: string): Promise<Recipe | undefined> => {
  return globalForData.recipes!.find(recipe => recipe.id === id);
};

export const getTags = async (): Promise<string[]> => {
    const allTags = new Set<string>();
    globalForData.recipes!.forEach(recipe => {
        recipe.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
}

export const addRecipe = async (recipe: Omit<Recipe, 'id'>): Promise<Recipe> => {
  const newRecipe: Recipe = {
    ...recipe,
    id: String(Date.now() + Math.random()),
    imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF'
  };
  globalForData.recipes!.unshift(newRecipe);
  return newRecipe;
};

export const updateRecipe = async (recipe: Recipe): Promise<Recipe> => {
    const index = globalForData.recipes!.findIndex(r => r.id === recipe.id);
    if (index === -1) {
        throw new Error('Recipe not found');
    }
    globalForData.recipes![index] = { ...recipe, imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF' };
    return recipe;
};

export const deleteRecipe = async (id: string): Promise<void> => {
    const index = globalForData.recipes!.findIndex(r => r.id === id);
    if (index === -1) {
        throw new Error('Recipe not found');
    }
    globalForData.recipes!.splice(index, 1);
};
