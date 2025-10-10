// Re-export the main Recipe type from lib/types
export type { Recipe, User } from '@/lib/types';

// Additional interfaces for Recipe Hub
export interface RecipeFilters {
  query?: string;
  tag?: string;
  course?: string;
  cuisine?: string;
  difficulty?: string;
  userId?: string;
}

export interface RecipeFormData {
  title: string;
  contributor: string;
  prepTime: number;
  cookTime?: number;
  servings: number;
  difficulty: string;
  course: string;
  cuisine: string;
  tags: string;
  summary: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  imageHint: string;
}
