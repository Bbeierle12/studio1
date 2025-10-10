// Unified Recipe Types for Recipe Hub

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  contributor: string;
  course: string | null;
  cuisine: string | null;
  difficulty: string | null;
  prepTime: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  servings: number | null;
  tags: string;
  summary: string;
  imageUrl: string;
  imageHint?: string;
  ingredients: string;
  instructions: string;
  userId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface RecipeFilters {
  query?: string;
  tag?: string;
  course?: string;
  cuisine?: string;
  difficulty?: string;
  userId?: string;
}

export interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
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
  imageHint?: string;
}
