export type Recipe = {
  id: string;
  title: string;
  contributor: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  summary: string;
  userId?: string;
  prepTime?: number;
  servings?: number;
  course?: 'Appetizer' | 'Main' | 'Dessert' | 'Side' | 'Breakfast';
  cuisine?: 'Italian' | 'American' | 'Mexican' | 'Asian' | 'Other';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  story?: string;
};

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};
