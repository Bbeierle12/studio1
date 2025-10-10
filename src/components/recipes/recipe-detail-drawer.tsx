'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Pencil, 
  Calendar, 
  Share2, 
  Printer, 
  Clock,
  Users,
  ChefHat,
  Heart,
  X,
  Check
} from 'lucide-react';
import { VoiceAssistant } from '@/components/voice-assistant';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RecipeDetailDrawerProps {
  recipeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailDrawer({
  recipeId,
  open,
  onOpenChange,
}: RecipeDetailDrawerProps) {
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () =>
      fetch(`/api/recipes/${recipeId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch recipe');
        return res.json();
      }),
    enabled: !!recipeId && open,
    staleTime: 5 * 60 * 1000,
  });

  const handlePrint = () => {
    window.print();
    toast({
      title: 'Print',
      description: 'Opening print dialog...',
    });
  };

  const handleShare = async () => {
    if (navigator.share && recipe) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.summary,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Recipe link copied to clipboard',
      });
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      description: isFavorited 
        ? 'Recipe removed from your favorites' 
        : 'Recipe added to your favorites',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-2xl overflow-auto"
        side="right"
      >
        {isLoading ? (
          <RecipeDetailSkeleton />
        ) : recipe ? (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <SheetTitle className="text-2xl pr-8">{recipe.title}</SheetTitle>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/recipes/${recipe.slug}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/meal-planning?recipe=${recipe.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Meal Plan
                  </Link>
                </Button>
                <Button 
                  variant={isFavorited ? 'default' : 'outline'} 
                  size="sm"
                  onClick={handleFavorite}
                >
                  {isFavorited ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Heart className="h-4 w-4 mr-2" />
                  )}
                  {isFavorited ? 'Favorited' : 'Favorite'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>

              {/* Recipe Image */}
              {recipe.imageUrl && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Recipe Meta */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                {recipe.prepTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{recipe.prepTime} min</div>
                      <div className="text-xs text-muted-foreground">Prep Time</div>
                    </div>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{recipe.servings}</div>
                      <div className="text-xs text-muted-foreground">Servings</div>
                    </div>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{recipe.difficulty}</div>
                      <div className="text-xs text-muted-foreground">Difficulty</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {recipe.tags && (
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.split(',').map((tag: string) => (
                    <Badge key={tag.trim()} variant="secondary">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Summary */}
              {recipe.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{recipe.summary}</p>
                </div>
              )}

              {/* Ingredients */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Ingredients</h3>
                <div className="text-sm space-y-2 whitespace-pre-wrap">
                  {recipe.ingredients}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Instructions</h3>
                <div className="text-sm space-y-3 whitespace-pre-wrap">
                  {recipe.instructions}
                </div>
              </div>

              {/* Contributor */}
              {recipe.contributor && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Contributed by <span className="font-medium">{recipe.contributor}</span>
                  </p>
                </div>
              )}

              {/* Voice Assistant */}
              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-3">Cooking Assistant</h3>
                <VoiceAssistant
                  currentRecipe={{
                    id: recipe.id,
                    title: recipe.title,
                    ingredients: recipe.ingredients,
                    instructions: recipe.instructions,
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Recipe not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RecipeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
