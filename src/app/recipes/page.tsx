'use client';

import { useState, useEffect, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeBrowser } from '@/components/recipes/recipe-browser';
import { RecipeCreator } from '@/components/recipes/recipe-creator';
import { MyRecipes } from '@/components/recipes/my-recipes';
import { RecipeDetailDrawer } from '@/components/recipes/recipe-detail-drawer';
import { RecipeSidebar } from '@/components/recipes/recipe-sidebar';
import { Book, Plus, Heart, ChefHat } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function RecipeHubPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('browse');

  // Support deep linking with ?tab=create, ?recipe=id, etc.
  useEffect(() => {
    const tab = searchParams.get('tab');
    const recipeId = searchParams.get('recipe');
    
    if (tab && ['browse', 'create', 'my-recipes'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (recipeId) {
      setSelectedRecipe(recipeId);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without page reload
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.push(`/recipes?${params.toString()}`, { scroll: false });
  };

  const handleSelectRecipe = (recipeId: string) => {
    setSelectedRecipe(recipeId);
    // Update URL with recipe ID
    const params = new URLSearchParams(searchParams);
    params.set('recipe', recipeId);
    router.push(`/recipes?${params.toString()}`, { scroll: false });
  };

  const handleCloseRecipe = () => {
    setSelectedRecipe(null);
    // Remove recipe from URL
    const params = new URLSearchParams(searchParams);
    params.delete('recipe');
    const newUrl = params.toString() ? `/recipes?${params.toString()}` : '/recipes';
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <RecipeSidebar activeTab={activeTab} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <ChefHat className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Recipe Hub</h1>
            </div>
            <p className="text-muted-foreground">
              Browse, create, and manage all your recipes in one place
            </p>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="browse" className="gap-2">
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">Browse</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </TabsTrigger>
              <TabsTrigger value="my-recipes" className="gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">My Recipes</span>
              </TabsTrigger>
            </TabsList>

            <Suspense fallback={<div>Loading...</div>}>
              <TabsContent value="browse" className="space-y-4">
                <RecipeBrowser onSelectRecipe={handleSelectRecipe} />
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <RecipeCreator />
              </TabsContent>

              <TabsContent value="my-recipes" className="space-y-4">
                <MyRecipes onSelectRecipe={handleSelectRecipe} />
              </TabsContent>
            </Suspense>
          </Tabs>
        </div>
      </div>

      {/* Recipe Detail Drawer */}
      <RecipeDetailDrawer
        recipeId={selectedRecipe}
        open={!!selectedRecipe}
        onOpenChange={(open: boolean) => !open && handleCloseRecipe()}
      />
    </div>
  );
}
