import { useMutation } from '@tanstack/react-query';

export interface NLPPlanResult {
  success: boolean;
  clarificationNeeded?: boolean;
  question?: string;
  intent?: string;
  actions?: Array<{
    action: string;
    recipeName?: string;
    date?: string;
    mealType?: string;
  }>;
  results?: Array<{
    action: string;
    success: boolean;
    meal?: any;
    deletedCount?: number;
    error?: string;
  }>;
  parsed?: any;
}

export interface GenerateMealPlanParams {
  startDate: string;
  endDate: string;
  mealTypes?: string[];
  dietaryConstraints?: string[];
  calorieTarget?: number;
  cuisinePreferences?: string[];
  variety?: 'low' | 'medium' | 'high';
}

export function useNLPMealPlanning() {
  return useMutation({
    mutationFn: async (command: string) => {
      const response = await fetch('/api/ai/nlp-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process command');
      }

      return response.json() as Promise<NLPPlanResult>;
    },
  });
}

export function useGenerateMealPlan() {
  return useMutation({
    mutationFn: async (params: GenerateMealPlanParams) => {
      const response = await fetch('/api/ai/nlp-plan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meal plan');
      }

      return response.json();
    },
  });
}
