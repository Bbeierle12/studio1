'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';

interface NavigationCounts {
  recipes: number;
  mealPlan: number;
  family: number;
  saved: number;
}

interface NavigationCountsContextType {
  counts: NavigationCounts;
  refreshCounts: () => Promise<void>;
  loading: boolean;
}

const NavigationCountsContext = createContext<NavigationCountsContextType | undefined>(undefined);

export function NavigationCountsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NavigationCounts>({
    recipes: 0,
    mealPlan: 0,
    family: 0,
    saved: 0,
  });
  const [loading, setLoading] = useState(true);

  const refreshCounts = async () => {
    if (!user) {
      setCounts({ recipes: 0, mealPlan: 0, family: 0, saved: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch counts from API in parallel
      const [recipesRes, mealPlanRes, familyRes, savedRes] = await Promise.allSettled([
        fetch('/api/recipes/count'),
        fetch('/api/meal-plan/count'),
        fetch('/api/household/count'),
        fetch('/api/saved/count'),
      ]);

      const newCounts: NavigationCounts = {
        recipes: recipesRes.status === 'fulfilled' && recipesRes.value.ok 
          ? (await recipesRes.value.json()).count 
          : 0,
        mealPlan: mealPlanRes.status === 'fulfilled' && mealPlanRes.value.ok 
          ? (await mealPlanRes.value.json()).count 
          : 0,
        family: familyRes.status === 'fulfilled' && familyRes.value.ok 
          ? (await familyRes.value.json()).count 
          : 0,
        saved: savedRes.status === 'fulfilled' && savedRes.value.ok 
          ? (await savedRes.value.json()).count 
          : 0,
      };

      setCounts(newCounts);
    } catch (error) {
      console.error('Failed to fetch navigation counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, [user]);

  return (
    <NavigationCountsContext.Provider value={{ counts, refreshCounts, loading }}>
      {children}
    </NavigationCountsContext.Provider>
  );
}

export function useNavigationCounts() {
  const context = useContext(NavigationCountsContext);
  if (!context) {
    throw new Error('useNavigationCounts must be used within NavigationCountsProvider');
  }
  return context;
}
