import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface TemplateMeal {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipeId?: string;
  customMealName?: string;
  servings: number;
}

export interface MealTemplate {
  id: string;
  userId: string;
  name: string;
  meals: TemplateMeal[];
  createdAt: string;
  updatedAt: string;
}

// Fetch all templates for the user
export function useMealTemplates() {
  return useQuery<MealTemplate[]>({
    queryKey: ['meal-templates'],
    queryFn: async () => {
      const response = await fetch('/api/meal-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      return response.json();
    },
  });
}

// Create a new template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; meals: TemplateMeal[] }) => {
      const response = await fetch('/api/meal-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-templates'] });
    },
  });
}

// Delete a template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/meal-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-templates'] });
    },
  });
}
