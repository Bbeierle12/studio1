// API functions for Recipe Hub

import { Recipe, RecipeFilters } from '@/types/recipe';

/**
 * Fetch recipes with optional filters
 */
export async function fetchRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
  const params = new URLSearchParams();
  
  if (filters.query) params.set('query', filters.query);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.course) params.set('course', filters.course);
  if (filters.cuisine) params.set('cuisine', filters.cuisine);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.userId) params.set('userId', filters.userId);
  
  const url = `/api/recipes${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch recipes: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Fetch a single recipe by ID
 */
export async function fetchRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch recipe: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Fetch user's favorite recipes
 */
export async function fetchFavoriteRecipes(): Promise<Recipe[]> {
  const res = await fetch('/api/recipes/favorites');
  
  if (!res.ok) {
    // Return empty array if not authenticated or no favorites
    if (res.status === 401) return [];
    throw new Error(`Failed to fetch favorites: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Fetch user's created recipes
 */
export async function fetchUserRecipes(userId: string): Promise<Recipe[]> {
  const res = await fetch(`/api/recipes?userId=${userId}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch user recipes: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Toggle favorite status for a recipe
 */
export async function toggleFavorite(recipeId: string): Promise<{ favorited: boolean }> {
  const res = await fetch(`/api/recipes/${recipeId}/favorite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to toggle favorite: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Fetch all available tags
 */
export async function fetchTags(): Promise<string[]> {
  const res = await fetch('/api/recipes/tags');
  
  if (!res.ok) {
    throw new Error(`Failed to fetch tags: ${res.statusText}`);
  }
  
  return res.json();
}
