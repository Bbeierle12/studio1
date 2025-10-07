import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface NutritionGoal {
  id: string;
  userId: string;
  name?: string;
  targetCalories: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetFiber?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DailySummaryResponse {
  date: string;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    mealsCount: number;
  };
  goal?: NutritionGoal;
  breakdown: any[];
}

interface WeeklySummaryResponse {
  startDate: string;
  endDate: string;
  dailyNutrition: any[];
  weeklyAverage: any;
  weeklyTotal: any;
  goal?: NutritionGoal;
  daysWithData: number;
}

/**
 * Hook to fetch user's nutrition goals
 */
export function useNutritionGoals(activeOnly = true) {
  return useQuery<NutritionGoal[]>({
    queryKey: ['nutrition', 'goals', { activeOnly }],
    queryFn: async () => {
      const response = await fetch(
        `/api/nutrition/goals?active=${activeOnly}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition goals');
      }
      return response.json();
    },
  });
}

/**
 * Hook to fetch daily nutrition summary
 */
export function useDailyNutrition(date: Date) {
  return useQuery<DailySummaryResponse>({
    queryKey: ['nutrition', 'daily', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(
        `/api/nutrition/summary?date=${format(date, 'yyyy-MM-dd')}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch daily nutrition');
      }
      return response.json();
    },
  });
}

/**
 * Hook to fetch weekly nutrition summary
 */
export function useWeeklyNutrition(startDate: Date) {
  return useQuery<WeeklySummaryResponse>({
    queryKey: ['nutrition', 'weekly', format(startDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(
        `/api/nutrition/weekly-summary?startDate=${format(startDate, 'yyyy-MM-dd')}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch weekly nutrition');
      }
      return response.json();
    },
  });
}

/**
 * Hook to create a nutrition goal
 */
export function useCreateNutritionGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NutritionGoal>) => {
      const response = await fetch('/api/nutrition/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create nutrition goal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'goals'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'weekly'] });
    },
  });
}

/**
 * Hook to update a nutrition goal
 */
export function useUpdateNutritionGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NutritionGoal> & { id: string }) => {
      const response = await fetch('/api/nutrition/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update nutrition goal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'goals'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'weekly'] });
    },
  });
}

/**
 * Hook to delete a nutrition goal
 */
export function useDeleteNutritionGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/nutrition/goals?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete nutrition goal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'goals'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'weekly'] });
    },
  });
}

/**
 * Hook to update recipe nutrition
 */
export function useUpdateRecipeNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, ...data }: any) => {
      const response = await fetch(`/api/recipes/${recipeId}/nutrition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update recipe nutrition');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'weekly'] });
    },
  });
}
