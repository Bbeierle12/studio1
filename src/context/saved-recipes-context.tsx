'use client';

import type { Recipe } from '@/lib/types';
import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';


type SavedRecipeItem = {
  id: string;
  recipe: Recipe;
  savedAt: number;
}

type SavedRecipesContextType = {
  savedRecipes: SavedRecipeItem[];
  isRecipeSaved: (recipeId: string) => boolean;
  saveRecipe: (recipe: Recipe) => void;
  removeRecipe: (recipeId: string) => void;
  getSavedRecipe: (recipeId: string) => Recipe | undefined;
  getSavedRecipesCount: () => number;
};

const SavedRecipesContext = createContext<SavedRecipesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'savedRecipes';

export function SavedRecipesProvider({ children }: { children: ReactNode }) {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedItems) {
        setSavedRecipes(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Failed to parse saved recipes from localStorage', error);
    }
  }, []);

  const persistRecipes = (recipes: SavedRecipeItem[]) => {
     try {
        setSavedRecipes(recipes);
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recipes));
     } catch (error) {
        console.error('Failed to save recipes to localStorage', error);
        toast({
            variant: 'destructive',
            title: 'Could Not Save Recipe',
            description: 'Your browser storage might be full. Please clear some space and try again.'
        })
     }
  }

  const saveRecipe = useCallback((recipe: Recipe) => {
    setSavedRecipes(prev => {
        const alreadyExists = prev.some(item => item.id === recipe.id);
        if (alreadyExists) return prev;

        const newItem: SavedRecipeItem = { id: recipe.id, recipe, savedAt: Date.now() };
        const updatedRecipes = [...prev, newItem];
        persistRecipes(updatedRecipes);
        toast({
            title: 'Recipe Saved Offline',
            description: `"${recipe.title}" is now available offline.`
        });
        return updatedRecipes;
    });
  }, [toast]);

  const removeRecipe = useCallback((recipeId: string) => {
    setSavedRecipes(prev => {
        const recipeToRemove = prev.find(item => item.id === recipeId);
        const updatedRecipes = prev.filter(item => item.id !== recipeId);
        persistRecipes(updatedRecipes);
        if (recipeToRemove) {
            toast({
                title: 'Recipe Removed',
                description: `"${recipeToRemove.recipe.title}" is no longer saved for offline access.`
            });
        }
        return updatedRecipes;
    });
  }, [toast]);

  const isRecipeSaved = useCallback((recipeId: string) => {
    return savedRecipes.some(item => item.id === recipeId);
  }, [savedRecipes]);

  const getSavedRecipe = useCallback((recipeId: string) => {
    return savedRecipes.find(item => item.id === recipeId)?.recipe;
  }, [savedRecipes]);
  
  const getSavedRecipesCount = useCallback(() => {
    return savedRecipes.length;
  }, [savedRecipes]);

  const value = { savedRecipes, isRecipeSaved, saveRecipe, removeRecipe, getSavedRecipe, getSavedRecipesCount };

  return (
    <SavedRecipesContext.Provider value={value}>
      {children}
    </SavedRecipesContext.Provider>
  );
}

export const useSavedRecipes = () => {
  const context = useContext(SavedRecipesContext);
  if (context === undefined) {
    throw new Error('useSavedRecipes must be used within a SavedRecipesProvider');
  }
  return context;
};
