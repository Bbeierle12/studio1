'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeBrowser } from '@/components/recipes/recipe-browser';
import { RecipeCreator } from '@/components/recipes/recipe-creator';
import { MyRecipes } from '@/components/recipes/my-recipes';
import { RecipeCollections } from '@/components/recipes/recipe-collections';
import { RecipeDetailDrawer } from '@/components/recipes/recipe-detail-drawer';
import { RecipeSidebar } from '@/components/recipes/recipe-sidebar';
import { Book, Plus, Heart, ChefHat, Library, Grid } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chat creator to avoid SSR issues with canvas
const ChatRecipeCreator = lazy(() => 
  import('@/components/recipes/chat-recipe-creator').then(mod => ({ 
    default: mod.ChatRecipeCreator 
  }))
);

function ChatRecipeCreatorWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chat interface...</p>
        </div>
      </div>
    }>
      <ChatRecipeCreator />
    </Suspense>
  );
}

function RecipeHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [browseSubTab, setBrowseSubTab] = useState('all');

  // Support deep linking with ?tab=create, ?recipe=id, etc.
  useEffect(() => {
    const tab = searchParams.get('tab');
    const recipeId = searchParams.get('recipe');
    const subTab = searchParams.get('subTab');
    
    if (tab && ['browse', 'create', 'my-recipes'].includes(tab)) {
      setActiveTab(tab);
    }

    if (subTab && ['all', 'collections'].includes(subTab)) {
      setBrowseSubTab(subTab);
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

  const handleBrowseSubTabChange = (value: string) => {
    setBrowseSubTab(value);
    // Update URL without page reload
    const params = new URLSearchParams(searchParams);
    params.set('subTab', value);
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

  // Full-screen chat mode for Create tab
  if (activeTab === 'create') {
    return <ChatRecipeCreatorWrapper />;
  }

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
                {/* Nested tabs for Browse: All Recipes and Collections */}
                <Tabs value={browseSubTab} onValueChange={handleBrowseSubTabChange}>
                  <TabsList className="grid w-full grid-cols-2 max-w-xs">
                    <TabsTrigger value="all" className="gap-2">
                      <Grid className="h-4 w-4" />
                      <span>All Recipes</span>
                    </TabsTrigger>
                    <TabsTrigger value="collections" className="gap-2">
                      <Library className="h-4 w-4" />
                      <span>Collections</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    <RecipeBrowser onSelectRecipe={handleSelectRecipe} />
                  </TabsContent>

                  <TabsContent value="collections" className="mt-4">
                    <RecipeCollections />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="create" className="h-full">
                {/* This won't render due to full-screen mode above */}
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

export default function RecipeHubPage() {
  return (
    <Suspense fallback={<RecipeHubSkeleton />}>
      <RecipeHubContent />
    </Suspense>
  );
}

function RecipeHubSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="hidden md:block w-64 border-r bg-muted/30 p-4">
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-10 w-full max-w-md mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
