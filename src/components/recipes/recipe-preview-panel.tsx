'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Save, 
  Clock, 
  Users, 
  ChefHat, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { addRecipeAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface RecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  prepTime?: number;
  servings?: number;
  course?: string;
  cuisine?: string;
  difficulty?: string;
  story?: string;
}

interface RecipePreviewPanelProps {
  recipeData: RecipeData;
  conversationStep: string;
  onClose: () => void;
}

export function RecipePreviewPanel({ 
  recipeData, 
  conversationStep, 
  onClose 
}: RecipePreviewPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const isComplete = conversationStep === 'complete' || 
    (recipeData.title && 
     recipeData.ingredients.length > 0 && 
     recipeData.instructions.length > 0);

  const handleSaveRecipe = async () => {
    if (!isComplete) {
      toast({
        title: 'Recipe Incomplete',
        description: 'Please provide at least a title, ingredients, and instructions.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set('title', recipeData.title);
      formData.set('ingredients', recipeData.ingredients.join('\n'));
      formData.set('instructions', recipeData.instructions.join('\n'));
      formData.set('tags', recipeData.tags.join(', '));
      formData.set('contributor', user?.name || 'Anonymous Chef');
      
      if (recipeData.prepTime) formData.set('prepTime', recipeData.prepTime.toString());
      if (recipeData.servings) formData.set('servings', recipeData.servings.toString());
      if (recipeData.course) formData.set('course', recipeData.course);
      if (recipeData.cuisine) formData.set('cuisine', recipeData.cuisine);
      if (recipeData.difficulty) formData.set('difficulty', recipeData.difficulty);
      if (recipeData.story) formData.set('story', recipeData.story);

      startTransition(async () => {
        const result = await addRecipeAction({ message: '', errors: {} }, formData);
        
        if (result.errors) {
          toast({
            title: 'Error',
            description: result.message || 'Failed to save recipe',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success! 🎉',
            description: 'Your recipe has been saved!',
          });
          
          // Redirect to recipes page after a short delay
          setTimeout(() => {
            router.push('/recipes?tab=my-recipes');
          }, 1500);
        }
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save recipe. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completionPercentage = () => {
    let completed = 0;
    const total = 5;
    
    if (recipeData.title) completed++;
    if (recipeData.ingredients.length > 0) completed++;
    if (recipeData.instructions.length > 0) completed++;
    if (recipeData.prepTime || recipeData.servings) completed++;
    if (recipeData.cuisine || recipeData.difficulty) completed++;
    
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-background border-l shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Recipe Preview</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="p-4 bg-muted/20">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completionPercentage()}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
            style={{ width: `${completionPercentage()}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Title */}
          {recipeData.title ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold text-lg">{recipeData.title}</h4>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p className="text-sm">No title yet...</p>
            </div>
          )}

          {/* Meta Info */}
          {(recipeData.prepTime || recipeData.servings || recipeData.difficulty) && (
            <div className="flex flex-wrap gap-2">
              {recipeData.prepTime && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {recipeData.prepTime} min
                </Badge>
              )}
              {recipeData.servings && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {recipeData.servings} servings
                </Badge>
              )}
              {recipeData.difficulty && (
                <Badge variant="secondary" className="gap-1">
                  <ChefHat className="h-3 w-3" />
                  {recipeData.difficulty}
                </Badge>
              )}
              {recipeData.cuisine && (
                <Badge variant="outline">
                  {recipeData.cuisine}
                </Badge>
              )}
            </div>
          )}

          <Separator />

          {/* Ingredients */}
          <div>
            <h5 className="font-semibold mb-2 flex items-center gap-2">
              {recipeData.ingredients.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              Ingredients ({recipeData.ingredients.length})
            </h5>
            {recipeData.ingredients.length > 0 ? (
              <ul className="space-y-1">
                {recipeData.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No ingredients added yet...
              </p>
            )}
          </div>

          <Separator />

          {/* Instructions */}
          <div>
            <h5 className="font-semibold mb-2 flex items-center gap-2">
              {recipeData.instructions.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              Instructions ({recipeData.instructions.length})
            </h5>
            {recipeData.instructions.length > 0 ? (
              <ol className="space-y-2">
                {recipeData.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm flex gap-2">
                    <span className="font-semibold text-primary min-w-[20px]">
                      {index + 1}.
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No instructions added yet...
              </p>
            )}
          </div>

          {/* Tags */}
          {recipeData.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h5 className="font-semibold mb-2">Tags</h5>
                <div className="flex flex-wrap gap-1">
                  {recipeData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t p-4 space-y-2 bg-muted/20">
        <Button
          className="w-full"
          onClick={handleSaveRecipe}
          disabled={!isComplete || isSaving || isPending}
          size="lg"
        >
          {isSaving || isPending ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Recipe
            </>
          )}
        </Button>
        
        {!isComplete && (
          <p className="text-xs text-center text-muted-foreground">
            Continue the conversation to complete your recipe
          </p>
        )}
      </div>
    </div>
  );
}
