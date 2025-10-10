'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { RecipeCard } from '@/components/recipe-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Clock, Star } from 'lucide-react';
import { Recipe } from '@/types/recipe';

interface MyRecipesProps {
  onSelectRecipe: (id: string) => void;
}

export function MyRecipes({ onSelectRecipe }: MyRecipesProps) {
  const { user } = useAuth();

  // Fetch user's created recipes
  const { data: myRecipes = [], isLoading: myRecipesLoading } = useQuery<Recipe[]>({
    queryKey: ['my-recipes', user?.id],
    queryFn: () =>
      fetch(`/api/recipes?userId=${user?.id}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch recipes');
        return res.json();
      }),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's favorite recipes
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Recipe[]>({
    queryKey: ['favorite-recipes', user?.id],
    queryFn: () =>
      fetch('/api/recipes/favorites').then(res => {
        if (!res.ok) {
          // Return empty array if endpoint doesn't exist yet
          if (res.status === 404) return [];
          throw new Error('Failed to fetch favorites');
        }
        return res.json();
      }),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recently viewed recipes (placeholder for now)
  const { data: recentlyViewed = [], isLoading: recentLoading } = useQuery<Recipe[]>({
    queryKey: ['recent-recipes', user?.id],
    queryFn: () => Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground mb-2">Sign in to view your recipes</p>
        <p className="text-sm text-muted-foreground">
          Create and save your favorite recipes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">My Recipes</h2>
        <p className="text-muted-foreground">
          Your created recipes, favorites, and recently viewed
        </p>
      </div>

      <Tabs defaultValue="created" className="space-y-6">
        <TabsList>
          <TabsTrigger value="created" className="gap-2">
            <Star className="h-4 w-4" />
            Created ({myRecipes.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2">
            <Heart className="h-4 w-4" />
            Favorites ({favorites.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Clock className="h-4 w-4" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          {myRecipesLoading ? (
            <RecipeGridSkeleton />
          ) : myRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => onSelectRecipe(recipe.id)}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-lg text-muted-foreground mb-2">No recipes created yet</p>
              <p className="text-sm text-muted-foreground">
                Start creating your first recipe!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          {favoritesLoading ? (
            <RecipeGridSkeleton />
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => onSelectRecipe(recipe.id)}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-2">No favorites yet</p>
              <p className="text-sm text-muted-foreground">
                Browse recipes and save your favorites!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          {recentLoading ? (
            <RecipeGridSkeleton />
          ) : recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentlyViewed.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => onSelectRecipe(recipe.id)}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-2">No recent activity</p>
              <p className="text-sm text-muted-foreground">
                Recipes you view will appear here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecipeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
