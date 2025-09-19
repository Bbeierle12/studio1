'use client';

import { useEffect, useState } from 'react';
import { useSavedRecipes } from '@/context/saved-recipes-context';
import { RecipeCard } from '@/components/recipe-card';
import { Bookmark } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SavedRecipesPage() {
    const { savedRecipes } = useSavedRecipes();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        // You can return a loading skeleton here if you want
        return null;
    }
    
    // Sort recipes by most recently saved
    const sortedRecipes = [...savedRecipes].sort((a, b) => b.savedAt - a.savedAt);

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight font-headline lg:text-4xl">
                    Saved Recipes
                </h1>
                <p className="text-muted-foreground">
                    Your collection of recipes saved for offline access.
                </p>
            </div>

            {sortedRecipes.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedRecipes.map(item => (
                        <RecipeCard key={item.id} recipe={item.recipe} />
                    ))}
                </div>
            ) : (
                <Alert className="max-w-xl mx-auto">
                    <Bookmark className="h-4 w-4" />
                    <AlertTitle>No Recipes Saved for Offline</AlertTitle>
                    <AlertDescription>
                        You haven't saved any recipes yet. Click the "Save Offline" button on a recipe page to add it to this list for easy access, even without an internet connection.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
