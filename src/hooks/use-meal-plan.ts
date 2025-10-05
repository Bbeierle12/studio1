'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MealPlan, PlannedMeal } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Fetch all meal plans for the current user
 */
async function fetchMealPlans(activeOnly = false): Promise<MealPlan[]> {
  const url = activeOnly ? '/api/meal-plans?active=true' : '/api/meal-plans';
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch meal plans');
  }
  
  return response.json();
}

/**
 * Fetch a specific meal plan
 */
async function fetchMealPlan(id: string): Promise<MealPlan> {
  const response = await fetch(`/api/meal-plans/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch meal plan');
  }
  
  return response.json();
}

/**
 * Create a new meal plan
 */
async function createMealPlan(data: {
  name: string;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}): Promise<MealPlan> {
  const response = await fetch('/api/meal-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create meal plan');
  }
  
  return response.json();
}

/**
 * Update a meal plan
 */
async function updateMealPlan(id: string, data: Partial<MealPlan>): Promise<MealPlan> {
  const response = await fetch(`/api/meal-plans/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update meal plan');
  }
  
  return response.json();
}

/**
 * Delete a meal plan
 */
async function deleteMealPlan(id: string): Promise<void> {
  const response = await fetch(`/api/meal-plans/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete meal plan');
  }
}

/**
 * Add a meal to a plan
 */
async function addMeal(mealPlanId: string, meal: {
  date: Date;
  mealType: string;
  recipeId?: string;
  customMealName?: string;
  servings?: number;
  notes?: string;
  weatherAtPlanning?: any;
}): Promise<PlannedMeal> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meal)
  });
  
  if (!response.ok) {
    throw new Error('Failed to add meal');
  }
  
  return response.json();
}

/**
 * Update a meal
 */
async function updateMeal(mealPlanId: string, mealId: string, updates: Partial<PlannedMeal>): Promise<PlannedMeal> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}/meals`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mealId, ...updates })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update meal');
  }
  
  return response.json();
}

/**
 * Delete a meal
 */
async function deleteMeal(mealPlanId: string, mealId: string): Promise<void> {
  const response = await fetch(`/api/meal-plans/${mealPlanId}/meals?mealId=${mealId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete meal');
  }
}

/**
 * Hook to manage meal plans
 */
export function useMealPlan(planId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all meal plans
  const { data: mealPlans, isLoading: isLoadingAll } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => fetchMealPlans()
  });

  // Get active meal plan
  const activeMealPlan = mealPlans?.find(plan => plan.isActive) || null;

  // Fetch specific meal plan
  const { data: specificPlan, isLoading: isLoadingSpecific } = useQuery({
    queryKey: ['mealPlan', planId],
    queryFn: () => fetchMealPlan(planId!),
    enabled: !!planId
  });

  // Create meal plan mutation
  const createMutation = useMutation({
    mutationFn: createMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: 'Success',
        description: 'Meal plan created successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create meal plan',
        variant: 'destructive'
      });
    }
  });

  // Update meal plan mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MealPlan> }) => 
      updateMealPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: 'Success',
        description: 'Meal plan updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update meal plan',
        variant: 'destructive'
      });
    }
  });

  // Delete meal plan mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: 'Success',
        description: 'Meal plan deleted successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete meal plan',
        variant: 'destructive'
      });
    }
  });

  // Add meal mutation
  const addMealMutation = useMutation({
    mutationFn: ({ mealPlanId, meal }: { mealPlanId: string; meal: any }) => 
      addMeal(mealPlanId, meal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: 'Success',
        description: 'Meal added successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add meal',
        variant: 'destructive'
      });
    }
  });

  // Update meal mutation
  const updateMealMutation = useMutation({
    mutationFn: ({ mealPlanId, mealId, updates }: { mealPlanId: string; mealId: string; updates: any }) => 
      updateMeal(mealPlanId, mealId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: 'Success',
        description: 'Meal updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update meal',
        variant: 'destructive'
      });
    }
  });

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: ({ mealPlanId, mealId }: { mealPlanId: string; mealId: string }) => 
      deleteMeal(mealPlanId, mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast({
        title: 'Success',
        description: 'Meal deleted successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete meal',
        variant: 'destructive'
      });
    }
  });

  return {
    // Data
    mealPlans,
    activeMealPlan,
    specificPlan,
    
    // Loading states
    isLoading: isLoadingAll || isLoadingSpecific,
    
    // Mutations
    createMealPlan: createMutation.mutate,
    updateMealPlan: updateMutation.mutate,
    deleteMealPlan: deleteMutation.mutate,
    addMeal: addMealMutation.mutate,
    updateMeal: updateMealMutation.mutate,
    deleteMeal: deleteMealMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
