import { useMutation } from '@tanstack/react-query';

export interface AutoTagResult {
  tags: string[];
  suggestedCuisine?: string;
  suggestedCourse?: string;
  mealType?: string[];
  dietaryLabels?: string[];
  difficulty?: string;
  cookingMethod?: string[];
  prepTime?: string;
  nutritionProfile?: string;
  seasonality?: string[];
  confidence: number;
}

export interface AutoTagParams {
  recipeId?: string;
  recipeName?: string;
  ingredients?: string[];
  instructions?: string;
  cuisine?: string;
  course?: string;
  existingTags?: string[];
  autoApply?: boolean;
}

export interface BatchAutoTagParams {
  recipeIds: string[];
  autoApply?: boolean;
}

export function useAutoTagRecipe() {
  return useMutation({
    mutationFn: async (params: AutoTagParams) => {
      const response = await fetch('/api/ai/auto-tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate tags');
      }

      return response.json() as Promise<AutoTagResult>;
    },
  });
}

export function useBatchAutoTag() {
  return useMutation({
    mutationFn: async (params: BatchAutoTagParams) => {
      const response = await fetch('/api/ai/auto-tag', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to batch tag recipes');
      }

      return response.json();
    },
  });
}
