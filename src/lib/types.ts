export type Recipe = {
  id: string;
  title: string;
  slug: string;
  contributor: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  imageHint: string;
  audioUrl?: string;
  tags: string[];
  summary: string;
  userId?: string;
  prepTime?: number;
  servings?: number;
  course?: 'Appetizer' | 'Main' | 'Dessert' | 'Side' | 'Breakfast';
  cuisine?: 'Italian' | 'American' | 'Mexican' | 'Asian' | 'Other';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  story?: string;
  originName?: string;
  originLat?: number;
  originLng?: number;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Plan = {
  id: string;
  recipeId: string;
  userId: string;
  plannedFor: Date;
  createdAt: Date;
  updatedAt: Date;
};
