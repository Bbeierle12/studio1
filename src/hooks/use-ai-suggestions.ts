import { useMutation, useQuery } from '@tanstack/react-query';

export interface MealSuggestion {
  recipeName: string;
  reason: string;
  cuisine?: string;
  calories?: number;
  tags?: string[];
  confidence: number;
  reasoning: string;
}

export interface MealSuggestionsResult {
  suggestions: MealSuggestion[];
}

export interface GenerateSuggestionsParams {
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  weather?: {
    temperature: number;
    condition: string;
    precipitation?: number;
  };
  includePreferences?: boolean;
  includeHistory?: boolean;
}

export function useAIMealSuggestions(params: GenerateSuggestionsParams | null) {
  return useQuery({
    queryKey: ['aiMealSuggestions', params],
    queryFn: async () => {
      if (!params) return null;
      
      const response = await fetch('/api/ai/suggest-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal suggestions');
      }

      return response.json() as Promise<MealSuggestionsResult>;
    },
    enabled: !!params,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGenerateMealSuggestions() {
  return useMutation({
    mutationFn: async (params: GenerateSuggestionsParams) => {
      const response = await fetch('/api/ai/suggest-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meal suggestions');
      }

      return response.json() as Promise<MealSuggestionsResult>;
    },
  });
}
